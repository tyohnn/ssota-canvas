'use server';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { createClerkDrizzleSupabaseClient } from '@/db';
import {
  blockPositions,
  type BlockPosition,
  type NewBlockPosition,
  blocks,
  type Block,
} from '@/db/schema';
import { ActionResult, ok, err } from '@/lib/action-result';
import { sql } from 'drizzle-orm';
import { devLog, devError, devWarn } from '@/utils/dev-logger';

// Create block position schema
const createBlockPositionSchema = z.object({
  blockId: z.uuid(),
  contextBlockId: z.uuid(),
  x: z.number(),
  y: z.number(),
});
export type CreateBlockPositionInput = z.infer<
  typeof createBlockPositionSchema
>;

// Update block position schema
const updateBlockPositionSchema = z.object({
  blockId: z.uuid(),
  contextBlockId: z.uuid(),
  x: z.number(),
  y: z.number(),
});
export type UpdateBlockPositionInput = z.infer<
  typeof updateBlockPositionSchema
>;

// Batch update block positions schema
const batchUpdateBlockPositionsSchema = z.object({
  contextBlockId: z.uuid(),
  positions: z.array(
    z.object({
      blockId: z.uuid(),
      x: z.number(),
      y: z.number(),
    })
  ),
});
export type BatchUpdateBlockPositionsInput = z.infer<
  typeof batchUpdateBlockPositionsSchema
>;

// List page block positions schema
const listPageBlockPositionsSchema = z.object({
  pageId: z.uuid(),
});
export type ListPageBlockPositionsInput = z.infer<
  typeof listPageBlockPositionsSchema
>;

// Combined block and position type for optimized data transfer
export type BlockWithPosition = {
  block: Block;
  position: BlockPosition;
};

/**
 * Create a new block position
 */
export async function createBlockPosition(
  input: CreateBlockPositionInput
): Promise<ActionResult<BlockPosition>> {
  try {
    devLog('📍 [Server] Creating block position', {
      blockId: input.blockId,
      contextBlockId: input.contextBlockId,
      position: { x: input.x, y: input.y },
    });

    const validated = createBlockPositionSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const inserted = await db.rls(async tx => {
      const [created] = await tx
        .insert(blockPositions)
        .values({
          block_id: validated.blockId,
          context_block_id: validated.contextBlockId,
          x_position: Math.round(validated.x),
          y_position: Math.round(validated.y),
        } satisfies Partial<NewBlockPosition>)
        .returning();
      return created as BlockPosition;
    });

    devLog('✅ [Server] Block position created successfully', {
      positionId: inserted.id,
      blockId: inserted.block_id,
      contextBlockId: inserted.context_block_id,
      position: { x: inserted.x_position, y: inserted.y_position },
    });

    return ok(inserted);
  } catch (e) {
    devError('❌ [Server] Failed to create block position', e);
    const message =
      e instanceof Error ? e.message : 'Failed to create block position';
    return err(message);
  }
}

/**
 * Update an existing block position
 */
export async function updateBlockPosition(
  input: UpdateBlockPositionInput
): Promise<ActionResult<BlockPosition>> {
  try {
    const validated = updateBlockPositionSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const updated = await db.rls(async tx => {
      const [row] = await tx
        .update(blockPositions)
        .set({
          x_position: Math.round(validated.x),
          y_position: Math.round(validated.y),
          updated_at: new Date(),
        })
        .where(
          and(
            eq(blockPositions.block_id, validated.blockId),
            eq(blockPositions.context_block_id, validated.contextBlockId)
          )
        )
        .returning();
      return row as BlockPosition;
    });

    if (!updated) {
      return err('Block position not found', { code: 'NOT_FOUND' });
    }

    return ok(updated);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Failed to update block position';
    return err(message);
  }
}

/**
 * Batch update block positions for a context
 */
export async function batchUpdateBlockPositions(
  input: BatchUpdateBlockPositionsInput
): Promise<ActionResult<BlockPosition[]>> {
  try {
    const validated = batchUpdateBlockPositionsSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const results = await db.rls(async tx => {
      const updatePromises = validated.positions.map(async pos => {
        // Check if position exists
        const [existingPosition] = await tx
          .select()
          .from(blockPositions)
          .where(
            and(
              eq(blockPositions.block_id, pos.blockId),
              eq(blockPositions.context_block_id, validated.contextBlockId)
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
                eq(blockPositions.context_block_id, validated.contextBlockId)
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
              context_block_id: validated.contextBlockId,
              x_position: Math.round(pos.x),
              y_position: Math.round(pos.y),
            })
            .returning();
          return created as BlockPosition;
        }
      });

      return await Promise.all(updatePromises);
    });

    return ok(results);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Failed to batch update block positions';
    return err(message);
  }
}

/**
 * Soft delete a block position
 */
export async function deleteBlockPosition(
  blockId: string,
  contextBlockId: string
): Promise<ActionResult<BlockPosition>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const deleted = await db.rls(async tx => {
      const [row] = await tx
        .update(blockPositions)
        .set({
          deleted_at: new Date(),
          updated_at: new Date(),
        })
        .where(
          and(
            eq(blockPositions.block_id, blockId),
            eq(blockPositions.context_block_id, contextBlockId)
          )
        )
        .returning();
      return row as BlockPosition;
    });

    if (!deleted) {
      return err('Block position not found', { code: 'NOT_FOUND' });
    }

    return ok(deleted);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Failed to delete block position';
    return err(message);
  }
}

/**
 * Restore a soft-deleted block position
 */
export async function restoreBlockPosition(
  blockId: string,
  contextBlockId: string
): Promise<ActionResult<BlockPosition>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const restored = await db.rls(async tx => {
      const [row] = await tx
        .update(blockPositions)
        .set({
          deleted_at: null,
          updated_at: new Date(),
        })
        .where(
          and(
            eq(blockPositions.block_id, blockId),
            eq(blockPositions.context_block_id, contextBlockId)
          )
        )
        .returning();
      return row as BlockPosition;
    });

    if (!restored) {
      return err('Block position not found', { code: 'NOT_FOUND' });
    }

    return ok(restored);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Failed to restore block position';
    return err(message);
  }
}

/**
 * List block positions for a specific page with block data
 */
export async function listPageBlockPositions(
  input: ListPageBlockPositionsInput
): Promise<ActionResult<{ blocksWithPositions: BlockWithPosition[] }>> {
  try {
    const { pageId } = listPageBlockPositionsSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async tx => {
      // Join positions with blocks to get combined data
      const joinedResult = await tx
        .select({
          position: blockPositions,
          block: blocks,
        })
        .from(blockPositions)
        .innerJoin(blocks, eq(blockPositions.block_id, blocks.id))
        .where(
          and(
            eq(blockPositions.context_block_id, pageId),
            sql`block_positions.deleted_at IS NULL`,
            sql`blocks.deleted_at IS NULL`
          )
        )
        .orderBy(blockPositions.created_at);

      // Map to BlockWithPosition objects
      const blocksWithPositions: BlockWithPosition[] = joinedResult.map(
        row => ({
          block: row.block as Block,
          position: row.position as BlockPosition,
        })
      );

      return { blocksWithPositions };
    });

    return ok(result);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Failed to list page block positions';
    return err(message);
  }
}
