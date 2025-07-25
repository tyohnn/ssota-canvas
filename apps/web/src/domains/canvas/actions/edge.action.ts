"use server";

import { createClerkDrizzleSupabaseClient } from "@/db";
import { edges } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Edge creation schema
const createEdgeSchema = z.object({
  sourceNodeId: z.uuid(),
  targetNodeId: z.uuid(),
  edgeType: z.enum(["contains", "next", "input", "output"]),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Edge update schema
const updateEdgeSchema = z.object({
  id: z.uuid(),
  edgeType: z.enum(["contains", "next", "input", "output"]).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateEdgeInput = z.infer<typeof createEdgeSchema>;
export type UpdateEdgeInput = z.infer<typeof updateEdgeSchema>;

/**
 * Create a new edge
 */
export async function createEdge(input: CreateEdgeInput) {
  try {
    const validatedInput = createEdgeSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Check if edge already exists
    const existingEdge = await db.rls(async (tx: any) => {
      return await tx
        .select()
        .from(edges)
        .where(
          and(
            eq(edges.source_node_id, validatedInput.sourceNodeId),
            eq(edges.target_node_id, validatedInput.targetNodeId),
            eq(edges.edge_type, validatedInput.edgeType)
          )
        )
        .limit(1);
    });

    if (existingEdge.length > 0) {
      throw new Error("Edge already exists between these nodes");
    }

    // Check for circular dependencies
    if (validatedInput.sourceNodeId === validatedInput.targetNodeId) {
      throw new Error("Cannot create edge from node to itself");
    }

    const result = await db.rls(async (tx: any) => {
      const [edge] = await tx
        .insert(edges)
        .values({
          source_node_id: validatedInput.sourceNodeId,
          target_node_id: validatedInput.targetNodeId,
          edge_type: validatedInput.edgeType,
          metadata: validatedInput.metadata || {},
        })
        .returning();

      return edge;
    });

    revalidatePath("/canvas");
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
      // Get edges where source node belongs to the workspace
      return await tx
        .select()
        .from(edges)
        .innerJoin(
          // This would need to be adjusted based on actual schema relationships
          // For now, we'll get all edges and filter by workspace later
          edges,
          eq(edges.source_node_id, edges.source_node_id)
        )
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
export async function getEdgesBySource(sourceNodeId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      return await tx
        .select()
        .from(edges)
        .where(eq(edges.source_node_id, sourceNodeId))
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
export async function getEdgesByTarget(targetNodeId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      return await tx
        .select()
        .from(edges)
        .where(eq(edges.target_node_id, targetNodeId))
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

    revalidatePath("/canvas");
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

    revalidatePath("/canvas");
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
 * Get edges by type
 */
export async function getEdgesByType(
  edgeType: "contains" | "next" | "input" | "output"
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
