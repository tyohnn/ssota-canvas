'use server';

import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { createClerkDrizzleSupabaseClient } from '@/db/clerk-client';
import { edges, type Edge, type NewEdge, edgeTypeEnum } from '@/db/schema';
import { ActionResult, ok, err } from '@/lib/action-result';

// Schemas aligned to DB
const EdgeTypeEnum = z.enum(edgeTypeEnum.enumValues);

const createEdgeSchema = z.object({
  sourceBlockId: z.uuid(),
  targetBlockId: z.uuid(),
  edgeType: EdgeTypeEnum,
  metadata: z.record(z.string(), z.any()).optional(),
  workspaceId: z.uuid(),
});
export type CreateEdgeInput = z.infer<typeof createEdgeSchema>;

const updateEdgeSchema = z.object({
  id: z.uuid(),
  edgeType: EdgeTypeEnum.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type UpdateEdgeInput = z.infer<typeof updateEdgeSchema>;

const getEdgeSchema = z.object({ id: z.uuid() });
export type GetEdgeInput = z.infer<typeof getEdgeSchema>;

const listEdgesSchema = z.object({ workspaceId: z.uuid() });
export type ListEdgesInput = z.infer<typeof listEdgesSchema>;

export async function createEdge(
  input: CreateEdgeInput
): Promise<ActionResult<Edge>> {
  try {
    const validated = createEdgeSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const inserted = await db.rls(async tx => {
      const [created] = await tx
        .insert(edges)
        .values({
          source_block_id: validated.sourceBlockId,
          target_block_id: validated.targetBlockId,
          edge_type: validated.edgeType,
          metadata: validated.metadata || {},
          workspace_id: validated.workspaceId,
        } satisfies Partial<NewEdge>)
        .returning();
      return created as Edge;
    });

    return ok(inserted);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create edge';
    return err(message);
  }
}

export async function updateEdge(
  input: UpdateEdgeInput
): Promise<ActionResult<Edge>> {
  try {
    const validated = updateEdgeSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const updated = await db.rls(async tx => {
      const updateData: Partial<Edge> = {};
      if (validated.edgeType)
        (updateData as any).edge_type = validated.edgeType;
      if (validated.metadata) (updateData as any).metadata = validated.metadata;
      (updateData as any).updated_at = new Date();

      const [row] = await tx
        .update(edges)
        .set(updateData)
        .where(eq(edges.id, validated.id))
        .returning();
      return row as Edge;
    });

    return ok(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update edge';
    return err(message);
  }
}

export async function deleteEdge(
  input: GetEdgeInput
): Promise<ActionResult<Edge>> {
  try {
    const { id } = getEdgeSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const deleted = await db.rls(async tx => {
      const [row] = await tx.delete(edges).where(eq(edges.id, id)).returning();
      return row as Edge;
    });

    return ok(deleted);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to delete edge';
    return err(message);
  }
}

export async function listWorkspaceEdges(
  input: ListEdgesInput
): Promise<ActionResult<Edge[]>> {
  try {
    const { workspaceId } = listEdgesSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const rows = await db.rls(async tx => {
      return (await tx
        .select()
        .from(edges)
        .where(eq(edges.workspace_id, workspaceId))
        .orderBy(desc(edges.created_at))) as Edge[];
    });

    return ok(rows);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Failed to list edges for workspace';
    return err(message);
  }
}
