"use server";

import { createClerkDrizzleSupabaseClient } from "@/db";
import { edges, blocks, Edge } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

// Edge creation schema
const createEdgeSchema = z.object({
  sourceBlockId: z.uuid(),
  targetBlockId: z.uuid(),
  edgeType: z.enum([
    "contains",
    "next",
    "input",
    "output",
    "accesses",
    "used_by",
  ]),
  metadata: z.record(z.string(), z.any()).optional(),
  workspaceId: z.uuid(),
});

// Batch edge creation schema
const batchCreateEdgesSchema = z.object({
  edges: z.array(
    z.object({
      sourceBlockId: z.uuid(),
      targetBlockId: z.uuid(),
      edgeType: z.enum([
        "contains",
        "next",
        "input",
        "output",
        "accesses",
        "used_by",
      ]),
      metadata: z.record(z.string(), z.any()).optional(),
    })
  ),
});

// Edge update schema
const updateEdgeSchema = z.object({
  id: z.uuid(),
  edgeType: z.enum(["contains", "next", "input", "output"]).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateEdgeInput = z.infer<typeof createEdgeSchema>;
export type BatchCreateEdgesInput = z.infer<typeof batchCreateEdgesSchema>;
export type UpdateEdgeInput = z.infer<typeof updateEdgeSchema>;

export type EdgeActionResult<T = any> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Create a new edge
 */
export async function createEdge(
  input: CreateEdgeInput
): Promise<EdgeActionResult<Edge>> {
  try {
    const validatedInput = createEdgeSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Check if edge already exists
    const existingEdge: Edge[] = await db.rls(async (tx) => {
      return await tx
        .select()
        .from(edges)
        .where(
          and(
            eq(edges.source_block_id, validatedInput.sourceBlockId),
            eq(edges.target_block_id, validatedInput.targetBlockId),
            eq(edges.edge_type, validatedInput.edgeType),
            eq(edges.workspace_id, validatedInput.workspaceId)
          )
        )
        .limit(1);
    });

    if (existingEdge.length > 0) {
      throw new Error("Edge already exists between these blocks");
    }

    // Check for circular dependencies
    if (validatedInput.sourceBlockId === validatedInput.targetBlockId) {
      throw new Error("Cannot create edge from block to itself");
    }

    const result: Edge | undefined = await db.rls(async (tx) => {
      const [edge] = await tx
        .insert(edges)
        .values({
          source_block_id: validatedInput.sourceBlockId,
          target_block_id: validatedInput.targetBlockId,
          edge_type: validatedInput.edgeType,
          metadata: validatedInput.metadata || {},
          workspace_id: validatedInput.workspaceId,
        })
        .returning();

      return edge;
    });

    if (!result) {
      throw new Error("Failed to create edge");
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating edge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create edge",
    };
  }
}

/**
 * Get edge by ID
 */
export async function getEdge(edgeId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      const [edge] = await tx
        .select()
        .from(edges)
        .where(eq(edges.id, edgeId))
        .limit(1);

      return edge || null;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting edge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get edge",
    };
  }
}

/**
 * Get all edges for a workspace
 */
export async function getWorkspaceEdges(workspaceId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      // Get edges where source block belongs to the workspace
      // Need to join with blocks table to filter by workspace
      return await tx
        .select({
          id: edges.id,
          source_block_id: edges.source_block_id,
          target_block_id: edges.target_block_id,
          edge_type: edges.edge_type,
          metadata: edges.metadata,
          created_at: edges.created_at,
          updated_at: edges.updated_at,
        })
        .from(edges)
        .innerJoin(blocks, eq(edges.source_block_id, blocks.id))
        .where(eq(blocks.workspace_id, workspaceId))
        .orderBy(desc(edges.created_at));
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting workspace edges:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get workspace edges",
    };
  }
}

/**
 * Get edges by source node
 */
export async function getEdgesBySource(sourceBlockId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      return await tx
        .select()
        .from(edges)
        .where(eq(edges.source_block_id, sourceBlockId))
        .orderBy(desc(edges.created_at));
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting edges by source:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get edges by source",
    };
  }
}

/**
 * Get edges by target node
 */
export async function getEdgesByTarget(targetBlockId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      return await tx
        .select()
        .from(edges)
        .where(eq(edges.target_block_id, targetBlockId))
        .orderBy(desc(edges.created_at));
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting edges by target:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get edges by target",
    };
  }
}

/**
 * Update edge
 */
export async function updateEdge(input: UpdateEdgeInput) {
  try {
    const validatedInput = updateEdgeSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      const updateData: any = {};
      if (validatedInput.edgeType)
        updateData.edge_type = validatedInput.edgeType;
      if (validatedInput.metadata)
        updateData.metadata = validatedInput.metadata;
      updateData.updated_at = new Date();

      const [edge] = await tx
        .update(edges)
        .set(updateData)
        .where(eq(edges.id, validatedInput.id))
        .returning();

      return edge;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating edge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update edge",
    };
  }
}

/**
 * Delete edge
 */
export async function deleteEdge(edgeId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      const [edge] = await tx
        .delete(edges)
        .where(eq(edges.id, edgeId))
        .returning();

      return edge;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error deleting edge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete edge",
    };
  }
}

/**
 * Batch create edges (for block insertion with multiple edges)
 */
export async function batchCreateEdges(input: BatchCreateEdgesInput) {
  try {
    const validatedInput = batchCreateEdgesSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const results = await db.rls(async (tx: any) => {
      const createPromises = validatedInput.edges.map(async (edgeData) => {
        // Check if edge already exists
        const [existingEdge] = await tx
          .select()
          .from(edges)
          .where(
            and(
              eq(edges.source_block_id, edgeData.sourceBlockId),
              eq(edges.target_block_id, edgeData.targetBlockId),
              eq(edges.edge_type, edgeData.edgeType)
            )
          )
          .limit(1);

        if (existingEdge) {
          console.log(
            `Edge already exists: ${edgeData.sourceBlockId} -> ${edgeData.targetBlockId} (${edgeData.edgeType})`
          );
          return existingEdge;
        }

        // Create new edge
        const [newEdge] = await tx
          .insert(edges)
          .values({
            source_block_id: edgeData.sourceBlockId,
            target_block_id: edgeData.targetBlockId,
            edge_type: edgeData.edgeType,
            metadata: edgeData.metadata || {},
          })
          .returning();

        return newEdge;
      });

      return await Promise.all(createPromises);
    });

    return { success: true, data: results };
  } catch (error) {
    console.error("Error batch creating edges:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to batch create edges",
    };
  }
}

/**
 * Get edges by type
 */
export async function getEdgesByType(
  edgeType: "contains" | "next" | "input" | "output" | "accesses" | "used_by"
) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      return await tx
        .select()
        .from(edges)
        .where(eq(edges.edge_type, edgeType))
        .orderBy(desc(edges.created_at));
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting edges by type:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get edges by type",
    };
  }
}
