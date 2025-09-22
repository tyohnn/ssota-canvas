"use server";

import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { createClerkDrizzleSupabaseClient } from "@/db";
import {
  blocks,
  blockTypeEnum,
  objectTypeEnum,
  type Block,
  type NewBlock,
  blockPositions,
  type BlockPosition,
} from "@/db/schema";
import { ActionResult, ok, err } from "@/lib/action-result";
import { SLUG_RE } from "@/lib/regex";

// zod enums aligned to db enums (runtime from schema)
const BlockTypeEnum = z.enum(blockTypeEnum.enumValues);
const ObjectEnum = z.enum(objectTypeEnum.enumValues);

// Create block input aligned with NewBlock
const createBlockSchema = z.object({
  blockType: BlockTypeEnum,
  slug: z
  .string()
  .min(1)
  .max(100)
  .regex(
    SLUG_RE,
    "Slug must contain only lowercase letters, numbers, hyphens, or Korean characters"
  ),
  title: z.string().min(1),
  workspaceId: z.uuid(),
  parentBlockId: z.uuid().nullable().optional(),
  object: ObjectEnum.optional(),
  order: z.number().optional(),
  icon_name: z.string().optional(),
  metadata: z.record(z.string(), z.any()),
});
export type CreateBlockInput = z.infer<typeof createBlockSchema>;

// Update block input aligned with partial Block
const updateBlockSchema = z.object({
  id: z.uuid(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      SLUG_RE,
      "Slug must contain only lowercase letters, numbers, hyphens, or Korean characters"
    )
    .optional(),
  title: z.string().min(1).optional(),
  workspaceId: z.uuid().optional(),
  parentBlockId: z.uuid().nullable().optional(),
  object: ObjectEnum.optional(),
  order: z.number().optional(),
  icon_name: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  deleted_at: z.date().optional(),
});
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;

// Get by id
const getBlockSchema = z.object({ id: z.uuid() });
export type GetBlockInput = z.infer<typeof getBlockSchema>;

// List by workspace
const listWorkspaceBlocksSchema = z.object({ workspaceId: z.uuid() });
export type ListWorkspaceBlocksInput = z.infer<
  typeof listWorkspaceBlocksSchema
>;

// List by type
const listBlocksByTypeSchema = z.object({
  workspaceId: z.uuid(),
  blockType: BlockTypeEnum,
});
export type ListBlocksByTypeInput = z.infer<typeof listBlocksByTypeSchema>;

// List page blocks only
const listWorkspacePageBlocksSchema = z.object({
  workspaceId: z.uuid(),
});
export type ListWorkspacePageBlocksInput = z.infer<
  typeof listWorkspacePageBlocksSchema
>;

// List component blocks only
const listWorkspaceComponentBlocksSchema = z.object({
  workspaceId: z.uuid(),
});
export type ListWorkspaceComponentBlocksInput = z.infer<
  typeof listWorkspaceComponentBlocksSchema
>;

// List block positions by workspace
const listWorkspaceBlockPositionsSchema = z.object({
  workspaceId: z.uuid(),
});
export type ListWorkspaceBlockPositionsInput = z.infer<
  typeof listWorkspaceBlockPositionsSchema
>;

// List page block positions only
const listWorkspacePageBlockPositionsSchema = z.object({
  workspaceId: z.uuid(),
});
export type ListWorkspacePageBlockPositionsInput = z.infer<
  typeof listWorkspacePageBlockPositionsSchema
>;

// List component block positions only
const listWorkspaceComponentBlockPositionsSchema = z.object({
  workspaceId: z.uuid(),
});
export type ListWorkspaceComponentBlockPositionsInput = z.infer<
  typeof listWorkspaceComponentBlockPositionsSchema
>;

/**
 * Create block (no position handling). Returns inserted Block.
 */
export async function createBlock(
  input: CreateBlockInput
): Promise<ActionResult<Block>> {
  try {
    const validated = createBlockSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Enforce slug uniqueness within workspace
    const existing = await db.rls(async (tx) => {
      return await tx
        .select({ id: blocks.id })
        .from(blocks)
        .where(
          and(
            eq(blocks.slug, validated.slug),
            eq(blocks.workspace_id, validated.workspaceId)
          )
        )
        .limit(1);
    });
    if (existing.length > 0) {
      return err("Block with this slug already exists in this workspace", {
        code: "DUPLICATE_SLUG",
      });
    }

    const inserted = await db.rls(async (tx) => {
      const [created] = await tx
        .insert(blocks)
        .values({
          block_type: validated.blockType,
          slug: validated.slug,
          title: validated.title,
          metadata: validated.metadata,
          object: validated.object,
          parent_block_id: validated.parentBlockId ?? undefined,
          workspace_id: validated.workspaceId,
        } satisfies Partial<NewBlock>)
        .returning();
      return created as Block;
    });

    return ok(inserted);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create block";
    return err(message);
  }
}

/**
 * Get block by id. Returns null when not found.
 */
export async function getBlockById(
  input: GetBlockInput
): Promise<ActionResult<Block | null>> {
  try {
    const { id } = getBlockSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx) => {
      const [row] = await tx
        .select()
        .from(blocks)
        .where(eq(blocks.id, id))
        .limit(1);
      return (row ?? null) as Block | null;
    });

    return ok(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get block";
    return err(message);
  }
}

/**
 * Update block fields. Validates slug uniqueness within the same workspace when slug changes.
 */
export async function updateBlock(
  input: UpdateBlockInput
): Promise<ActionResult<Block>> {
  try {
    const validated = updateBlockSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Load current block to know workspace for uniqueness check
    const current = await db.rls(async (tx) => {
      const [row] = await tx
        .select({
          id: blocks.id,
          workspace_id: blocks.workspace_id,
          slug: blocks.slug,
        })
        .from(blocks)
        .where(eq(blocks.id, validated.id))
        .limit(1);
      return row as Pick<Block, "id" | "workspace_id" | "slug"> | undefined;
    });

    if (!current) return err("Block not found", { code: "NOT_FOUND" });

    if (validated.slug && validated.slug !== current.slug) {
      const conflict = await db.rls(async (tx) => {
        return await tx
          .select({ id: blocks.id })
          .from(blocks)
          .where(
            and(
              eq(blocks.slug, validated.slug!),
              eq(blocks.workspace_id, current.workspace_id as string),
              sql`${blocks.id} != ${validated.id}`
            )
          )
          .limit(1);
      });
      if (conflict.length > 0) {
        return err("Block with this slug already exists in this workspace", {
          code: "DUPLICATE_SLUG",
        });
      }
    }

    const updated = await db.rls(async (tx) => {
      const updateData: Partial<Block> = {};
      if (validated.slug) updateData.slug = validated.slug;
      if (validated.title) updateData.title = validated.title;
      if (validated.metadata) updateData.metadata = validated.metadata;
      if (validated.object !== undefined)
        updateData.object = validated.object as any;
      if (validated.parentBlockId !== undefined)
        updateData.parent_block_id = validated.parentBlockId;
      if (validated.order !== undefined) updateData.order = validated.order;
      if (validated.deleted_at) updateData.deleted_at = validated.deleted_at;
      updateData.updated_at = new Date();

      const [row] = await tx
        .update(blocks)
        .set(updateData)
        .where(eq(blocks.id, validated.id))
        .returning();
      return row as Block;
    });

    return ok(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update block";
    return err(message);
  }
}

/**
 * Soft delete a block
 */
export async function deleteBlock(
  input: GetBlockInput
): Promise<ActionResult<Block>> {
  try {
    const { id } = getBlockSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const deleted = await db.rls(async (tx) => {
      const [row] = await tx
        .update(blocks)
        .set({
          deleted_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(blocks.id, id))
        .returning();
      return row as Block;
    });

    if (!deleted) {
      return err("Block not found", { code: "NOT_FOUND" });
    }

    return ok(deleted);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete block";
    return err(message);
  }
}

/**
 * Restore a soft-deleted block
 */
export async function restoreBlock(
  input: GetBlockInput
): Promise<ActionResult<Block>> {
  try {
    const { id } = getBlockSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const restored = await db.rls(async (tx) => {
      const [row] = await tx
        .update(blocks)
        .set({
          deleted_at: null,
          updated_at: new Date(),
        })
        .where(eq(blocks.id, id))
        .returning();
      return row as Block;
    });

    if (!restored) {
      return err("Block not found", { code: "NOT_FOUND" });
    }

    return ok(restored);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to restore block";
    return err(message);
  }
}

/**
 * List blocks in a workspace.
 */
export async function listWorkspaceBlocks(
  input: ListWorkspaceBlocksInput
): Promise<ActionResult<Block[]>> {
  try {
    const { workspaceId } = listWorkspaceBlocksSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const list = await db.rls(async (tx) => {
      const rows = await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.workspace_id, workspaceId),
            sql`blocks.deleted_at IS NULL`
          )
        )
        .orderBy(desc(blocks.created_at));
      return rows as Block[];
    });

    return ok(list);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list blocks";
    return err(message);
  }
}

/**
 * List soft-deleted blocks in a workspace
 */
export async function listSoftDeletedBlocks(
  input: ListWorkspaceBlocksInput
): Promise<ActionResult<Block[]>> {
  try {
    const { workspaceId } = listWorkspaceBlocksSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const list = await db.rls(async (tx) => {
      const rows = await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.workspace_id, workspaceId),
            sql`blocks.deleted_at IS NOT NULL`
          )
        )
        .orderBy(desc(blocks.deleted_at));
      return rows as Block[];
    });

    return ok(list);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to list soft-deleted blocks";
    return err(message);
  }
}

/**
 * List blocks by type in a workspace.
 */
export async function listBlocksByType(
  input: ListBlocksByTypeInput
): Promise<ActionResult<Block[]>> {
  try {
    const { workspaceId, blockType } = listBlocksByTypeSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const list = await db.rls(async (tx) => {
      const rows = await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.workspace_id, workspaceId),
            eq(blocks.block_type, blockType),
            sql`blocks.deleted_at IS NULL`
          )
        )
        .orderBy(desc(blocks.created_at));
      return rows as Block[];
    });

    return ok(list);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to list blocks by type";
    return err(message);
  }
}

/**
 * List page blocks only for a workspace.
 */
export async function listWorkspacePageBlocks(
  input: ListWorkspacePageBlocksInput
): Promise<ActionResult<Block[]>> {
  try {
    const { workspaceId } = listWorkspacePageBlocksSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const list = await db.rls(async (tx) => {
      const rows = await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.workspace_id, workspaceId),
            eq(blocks.object, "page"),
            sql`blocks.deleted_at IS NULL`
          )
        )
        .orderBy(desc(blocks.created_at));
      return rows as Block[];
    });

    return ok(list);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to list workspace page blocks";
    return err(message);
  }
}

/**
 * List component blocks only for a workspace.
 */
export async function listWorkspaceComponentBlocks(
  input: ListWorkspaceComponentBlocksInput
): Promise<ActionResult<Block[]>> {
  try {
    const { workspaceId } = listWorkspaceComponentBlocksSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const list = await db.rls(async (tx) => {
      const rows = await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.workspace_id, workspaceId),
            eq(blocks.object, "component"),
            sql`blocks.deleted_at IS NULL`
          )
        )
        .orderBy(desc(blocks.created_at));
      return rows as Block[];
    });

    return ok(list);
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "Failed to list workspace component blocks";
    return err(message);
  }
}

/**
 * List block positions for a workspace by joining through blocks workspace_id
 */
export async function listWorkspaceBlockPositions(
  input: ListWorkspaceBlockPositionsInput
): Promise<ActionResult<BlockPosition[]>> {
  try {
    const { workspaceId } = listWorkspaceBlockPositionsSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const rows = await db.rls(async (tx) => {
      // Join through blocks to filter by workspaceId
      const result = (await tx
        .select({ pos: blockPositions })
        .from(blockPositions)
        .innerJoin(blocks, eq(blockPositions.block_id, blocks.id))
        .where(eq(blocks.workspace_id, workspaceId))
        .orderBy(blockPositions.created_at)) as { pos: BlockPosition }[];
      return result.map((r) => r.pos);
    });

    return ok(rows);
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "Failed to list block positions for workspace";
    return err(message);
  }
}

/**
 * List block positions for page blocks only in a workspace
 */
export async function listWorkspacePageBlockPositions(
  input: ListWorkspacePageBlockPositionsInput
): Promise<ActionResult<BlockPosition[]>> {
  try {
    const { workspaceId } = listWorkspacePageBlockPositionsSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const rows = await db.rls(async (tx) => {
      // Join through blocks to filter by workspaceId and object=page
      const result = (await tx
        .select({ pos: blockPositions })
        .from(blockPositions)
        .innerJoin(blocks, eq(blockPositions.block_id, blocks.id))
        .where(
          and(eq(blocks.workspace_id, workspaceId), eq(blocks.object, "page"))
        )
        .orderBy(blockPositions.created_at)) as { pos: BlockPosition }[];
      return result.map((r) => r.pos);
    });

    return ok(rows);
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "Failed to list page block positions for workspace";
    return err(message);
  }
}

/**
 * List component block positions for a workspace
 */
export async function listWorkspaceComponentBlockPositions(
  input: ListWorkspaceComponentBlockPositionsInput
): Promise<ActionResult<BlockPosition[]>> {
  try {
    const { workspaceId } =
      listWorkspaceComponentBlockPositionsSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const rows = await db.rls(async (tx) => {
      // Join through blocks to filter by workspaceId and object=component
      const result = (await tx
        .select({ pos: blockPositions })
        .from(blockPositions)
        .innerJoin(blocks, eq(blockPositions.block_id, blocks.id))
        .where(
          and(
            eq(blocks.workspace_id, workspaceId),
            eq(blocks.object, "component")
          )
        )
        .orderBy(blockPositions.created_at)) as { pos: BlockPosition }[];
      return result.map((r) => r.pos);
    });

    return ok(rows);
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "Failed to list component block positions for workspace";
    return err(message);
  }
}
