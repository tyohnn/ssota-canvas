"use server";

import { createClerkDrizzleSupabaseClient } from "@/db";
import {
  blocks,
  blockPositions,
  Block,
  BlockPosition,
  type BlockPosition as DbBlockPosition,
} from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  TypedDbBlockMap,
  DbBlock,
} from "@/domains/workflow-canvas/policy/block-definition-policy";
import { BlockType, BlockMetadata } from "@workspace/domain-contracts";
import {
  EditorRenderingStrategyFactory,
  EditorBlockType,
} from "@/domains/workflow-canvas/policy/editor-rendering-policy";
import { ActionResult } from "@/lib/action-result";

// Block creation schema
const createBlockSchema = z.object({
  blockType: z.enum(BlockType),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  name: z.string().min(1).max(100),
  metadata: z.record(z.string(), z.any()),
  parentBlockId: z.uuid().optional(),
  workspaceId: z.uuid(),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
  }),
});

// Page block creation schema (simplified for canvas)
const createPageBlockSchema = z.object({
  blockType: z.enum(BlockType),
  workspaceId: z.uuid(),
});

// Context-based block position creation schema
const createBlockPositionSchema = z.object({
  blockId: z.uuid(),
  contextBlockId: z.uuid(),
  x: z.number().min(0),
  y: z.number().min(0),
});

// Batch block position update schema
const batchUpdateBlockPositionsSchema = z.object({
  positions: z.array(
    z.object({
      blockId: z.uuid(),
      contextBlockId: z.uuid(),
      x: z.number(),
      y: z.number(),
    })
  ),
});

// Block update schema
const updateBlockSchema = z.object({
  id: z.uuid(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional(),
  name: z.string().min(1).max(100).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  parentBlockId: z.uuid().optional(),
  position: z
    .object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
    })
    .optional(),
});

// Block position update schema
const updateBlockPositionSchema = z.object({
  blockId: z.string(), // Allow both UUID and local block IDs
  x: z.number().min(0), // Remove int constraint to allow decimal numbers
  y: z.number().min(0), // Remove int constraint to allow decimal numbers
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type CreatePageBlockInput = z.infer<typeof createPageBlockSchema>;
export type CreateBlockPositionInput = z.infer<
  typeof createBlockPositionSchema
>;
export type BatchUpdateBlockPositionsInput = z.infer<
  typeof batchUpdateBlockPositionsSchema
>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type UpdateBlockPositionInput = z.infer<
  typeof updateBlockPositionSchema
>;

// Extended types for frontend consumption

// API Response types unified under ActionResult<T>

/**
 * Create a new block with position
 */
export async function createBlock(input: CreateBlockInput) {
  try {
    const validatedInput = createBlockSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Check if slug is unique within workspace
    const existingBlock = await db.rls(async (tx: any) => {
      return await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.slug, validatedInput.slug),
            eq(blocks.workspace_id, validatedInput.workspaceId)
          )
        )
        .limit(1);
    });

    if (existingBlock.length > 0) {
      throw new Error("Block with this slug already exists in this workspace");
    }

    // Create block and position in transaction
    const result = await db.rls(async (tx: any) => {
      // Insert block
      const [block] = await tx
        .insert(blocks)
        .values({
          block_type: validatedInput.blockType,
          slug: validatedInput.slug,
          name: validatedInput.name,
          metadata: validatedInput.metadata,
          parent_block_id: validatedInput.parentBlockId,
          workspace_id: validatedInput.workspaceId,
        })
        .returning();

      // Insert position
      await tx.insert(blockPositions).values({
        block_id: block.id,
        x_position: validatedInput.position.x,
        y_position: validatedInput.position.y,
      });

      return block;
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating block:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create block",
    };
  }
}

/**
 * Get block by ID with position
 */
export async function getBlock(blockId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx) => {
      const [block]: Block[] = await tx
        .select()
        .from(blocks)
        .where(eq(blocks.id, blockId))
        .limit(1);

      if (!block) return null;

      const [position]: BlockPosition[] = await tx
        .select()
        .from(blockPositions)
        .where(eq(blockPositions.block_id, blockId))
        .limit(1);

      return {
        ...block,
        position: position
          ? { x: position.x_position, y: position.y_position }
          : null,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting block:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get block",
    };
  }
}

/**
 * Get all blocks for a workspace
 */
export async function getWorkspaceBlocks(
  workspaceId: string
): Promise<ActionResult<DbBlock[]>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx) => {
      const blocksData = await tx
        .select()
        .from(blocks)
        .where(eq(blocks.workspace_id, workspaceId))
        .orderBy(desc(blocks.created_at));

      return blocksData as DbBlock[];
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting workspace blocks:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get workspace blocks",
    };
  }
}

/**
 * Get all block positions for a workspace
 */
export async function getWorkspaceBlockPositions(
  workspaceId: string
): Promise<ActionResult<BlockPosition[]>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx) => {
      // Get all blocks first to get their IDs
      const blocksData: Block[] = await tx
        .select()
        .from(blocks)
        .where(eq(blocks.workspace_id, workspaceId));

      if (blocksData.length === 0) {
        return [];
      }

      // Get all positions for these blocks
      const blockIds = blocksData.map((block: Block) => block.id);
      const positionsData: BlockPosition[] = await tx
        .select()
        .from(blockPositions)
        .where(inArray(blockPositions.block_id, blockIds));

      return positionsData;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting workspace block positions:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get workspace block positions",
    };
  }
}

/**
 * Update block
 */
export async function updateBlock(input: UpdateBlockInput) {
  try {
    const validatedInput = updateBlockSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Check if slug is unique within workspace (if slug is being updated)
    if (validatedInput.slug) {
      const existingBlock: Block[] = await db.rls(async (tx) => {
        return await tx
          .select()
          .from(blocks)
          .where(
            and(
              eq(blocks.slug, validatedInput.slug!),
              sql`${blocks.id} != ${validatedInput.id}` // 현재 블록과 다른 ID
            )
          )
          .limit(1);
      });

      if (existingBlock.length > 0) {
        throw new Error(
          "Block with this slug already exists in this workspace"
        );
      }
    }

    const result = await db.rls(async (tx) => {
      const updateData: Partial<Block> = {};
      if (validatedInput.slug) updateData.slug = validatedInput.slug;
      if (validatedInput.name) updateData.name = validatedInput.name;
      if (validatedInput.metadata)
        updateData.metadata = validatedInput.metadata;
      if (validatedInput.parentBlockId !== undefined)
        updateData.parent_block_id = validatedInput.parentBlockId;
      updateData.updated_at = new Date();

      const [block]: Block[] = await tx
        .update(blocks)
        .set(updateData)
        .where(eq(blocks.id, validatedInput.id))
        .returning();

      return block;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating block:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update block",
    };
  }
}

/**
 * Update block position
 */
export async function updateBlockPosition(input: UpdateBlockPositionInput) {
  try {
    const validatedInput = updateBlockPositionSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx) => {
      const [position]: BlockPosition[] = await tx
        .update(blockPositions)
        .set({
          x_position: validatedInput.x,
          y_position: validatedInput.y,
        })
        .where(eq(blockPositions.block_id, validatedInput.blockId))
        .returning();

      return position;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating block position:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update block position",
    };
  }
}

/**
 * Delete block and its position
 */
export async function deleteBlock(blockId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx) => {
      // Delete position first (due to foreign key constraint)
      await tx
        .delete(blockPositions)
        .where(eq(blockPositions.block_id, blockId));

      // Delete block
      const [block]: Block[] = await tx
        .delete(blocks)
        .where(eq(blocks.id, blockId))
        .returning();

      return block;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error deleting block:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete block",
    };
  }
}

/**
 * 블록 타입별 초기 메타데이터 생성
 */
function generateInitialMetadata(blockType: BlockType): BlockMetadata {
  const strategy = EditorRenderingStrategyFactory.getStrategy(
    blockType as EditorBlockType
  );
  const defaultMetadata = strategy.getDefaultMetadata();

  const timestamp = Date.now();
  const slug = `${blockType}-${timestamp}`;
  const name = `New ${blockType.replace("_", " ")}`;

  // 타입별 기본값에 공통 필드 추가
  return {
    ...defaultMetadata,
    name,
    slug,
    description: `Auto-created ${blockType} page`,
  } as BlockMetadata;
}

/**
 * Create a page block (simplified block creation for canvas)
 * Generic version that returns the correct typed DbBlock based on block type
 */
export async function createPageBlock<T extends BlockType>(
  input: CreatePageBlockInput & { blockType: T }
): Promise<ActionResult<TypedDbBlockMap[T]>> {
  try {
    const validatedInput = createPageBlockSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const slug = `${validatedInput.blockType}-${Date.now()}`;
    const name = `New ${validatedInput.blockType.replace("_", " ")}`;

    // 블록 타입별 초기 메타데이터 생성
    const initialMetadata = generateInitialMetadata(validatedInput.blockType);

    const result = await db.rls(async (tx) => {
      const [block] = await tx
        .insert(blocks)
        .values({
          block_type: validatedInput.blockType,
          slug: slug,
          name: name,
          metadata: initialMetadata,
          workspace_id: validatedInput.workspaceId,
        })
        .returning();

      return block as TypedDbBlockMap[T];
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating page block:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create page block",
    };
  }
}

/**
 * Create a context-based block position
 */
export async function createBlockPosition(input: CreateBlockPositionInput) {
  try {
    const validatedInput = createBlockPositionSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx) => {
      const [position] = await tx
        .insert(blockPositions)
        .values({
          block_id: validatedInput.blockId,
          context_block_id: validatedInput.contextBlockId,
          x_position: Math.round(validatedInput.x),
          y_position: Math.round(validatedInput.y),
        })
        .returning();

      return position as BlockPosition;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating block position:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create block position",
    };
  }
}

/**
 * Batch update block positions (for layout policy results)
 */
export async function batchUpdateBlockPositions(
  input: BatchUpdateBlockPositionsInput
): Promise<ActionResult<DbBlockPosition[]>> {
  try {
    const validatedInput = batchUpdateBlockPositionsSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const results = await db.rls(async (tx) => {
      const updatePromises = validatedInput.positions.map(async (pos) => {
        // Check if position exists
        const [existingPosition] = await tx
          .select()
          .from(blockPositions)
          .where(
            and(
              eq(blockPositions.block_id, pos.blockId),
              eq(blockPositions.context_block_id, pos.contextBlockId)
            )
          )
          .limit(1);

        if (existingPosition) {
          // Update existing position
          const [updated] = await tx
            .update(blockPositions)
            .set({
              x_position: Math.round(pos.x),
              y_position: Math.round(pos.y),
              updated_at: new Date(),
            })
            .where(
              and(
                eq(blockPositions.block_id, pos.blockId),
                eq(blockPositions.context_block_id, pos.contextBlockId)
              )
            )
            .returning();
          return updated as BlockPosition;
        } else {
          // Create new position
          const [created] = await tx
            .insert(blockPositions)
            .values({
              block_id: pos.blockId,
              context_block_id: pos.contextBlockId,
              x_position: Math.round(pos.x),
              y_position: Math.round(pos.y),
            })
            .returning();
          return created as BlockPosition;
        }
      });

      return await Promise.all(updatePromises);
    });

    return { success: true, data: results };
  } catch (error) {
    console.error("Error batch updating block positions:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to batch update block positions",
    };
  }
}

/**
 * Update context-based block position (for drag operations)
 */
export async function updateContextBlockPosition(
  blockId: string,
  contextBlockId: string,
  x: number,
  y: number
): Promise<ActionResult<DbBlockPosition>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx) => {
      // Check if position exists
      const [existingPosition] = await tx
        .select()
        .from(blockPositions)
        .where(
          and(
            eq(blockPositions.block_id, blockId),
            eq(blockPositions.context_block_id, contextBlockId)
          )
        )
        .limit(1);

      if (existingPosition) {
        // Update existing position
        const [updated] = await tx
          .update(blockPositions)
          .set({
            x_position: Math.round(x),
            y_position: Math.round(y),
            updated_at: new Date(),
          })
          .where(
            and(
              eq(blockPositions.block_id, blockId),
              eq(blockPositions.context_block_id, contextBlockId)
            )
          )
          .returning();
        return updated as BlockPosition;
      } else {
        // Create new position
        const [created] = await tx
          .insert(blockPositions)
          .values({
            block_id: blockId,
            context_block_id: contextBlockId,
            x_position: Math.round(x),
            y_position: Math.round(y),
          })
          .returning();
        return created as BlockPosition;
      }
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating context block position:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update context block position",
    };
  }
}

/**
 * Get blocks by type for a workspace
 */
export async function getBlocksByType(
  workspaceId: string,
  blockType:
    | "agent"
    | "task"
    | "workflow"
    | "artifact_template"
    | "checklist"
    | "data"
    | "artifact_class"
) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      return await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.workspace_id, workspaceId),
            eq(blocks.block_type, blockType)
          )
        )
        .orderBy(desc(blocks.created_at));
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting blocks by type:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get blocks by type",
    };
  }
}
