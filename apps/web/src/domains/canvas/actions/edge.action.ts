"use server";

import { createClerkDrizzleSupabaseClient } from "@/lib/db";
import { edges, nodes, Edge, NewEdge } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const createEdgeSchema = z.object({
  source_node_id: z.string().uuid(),
  target_node_id: z.string().uuid(),
  edge_type: z.enum(["contains", "next", "input", "output"] as const),
  metadata: z.record(z.any()).optional(),
});

const updateEdgeSchema = z.object({
  id: z.string().uuid(),
  edge_type: z
    .enum(["contains", "next", "input", "output"] as const)
    .optional(),
  metadata: z.record(z.any()).optional(),
});

const getEdgesSchema = z.object({
  source_node_id: z.string().uuid().optional(),
  target_node_id: z.string().uuid().optional(),
  edge_type: z
    .enum(["contains", "next", "input", "output"] as const)
    .optional(),
});

// Create a new edge
export async function createEdge(
  data: z.infer<typeof createEdgeSchema>
): Promise<{ success: boolean; data?: Edge; error?: string }> {
  try {
    // Validate input data
    const validatedData = createEdgeSchema.parse(data);

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Check if source and target nodes exist and user has access
    const sourceNode = await db.rls((tx) =>
      tx
        .select()
        .from(nodes)
        .where(eq(nodes.id, validatedData.source_node_id))
        .limit(1)
    );

    if (sourceNode.length === 0) {
      return {
        success: false,
        error: "Source node not found or access denied",
      };
    }

    const targetNode = await db.rls((tx) =>
      tx
        .select()
        .from(nodes)
        .where(eq(nodes.id, validatedData.target_node_id))
        .limit(1)
    );

    if (targetNode.length === 0) {
      return {
        success: false,
        error: "Target node not found or access denied",
      };
    }

    // Prevent self-reference
    if (validatedData.source_node_id === validatedData.target_node_id) {
      return { success: false, error: "Edge cannot reference the same node" };
    }

    // Check if edge already exists
    const existingEdge = await db.rls((tx) =>
      tx
        .select()
        .from(edges)
        .where(
          and(
            eq(edges.source_node_id, validatedData.source_node_id),
            eq(edges.target_node_id, validatedData.target_node_id),
            eq(edges.edge_type, validatedData.edge_type)
          )
        )
        .limit(1)
    );

    if (existingEdge.length > 0) {
      return {
        success: false,
        error: "Edge already exists between these nodes",
      };
    }

    // Create the edge
    const newEdge = await db.rls((tx) =>
      tx
        .insert(edges)
        .values({
          ...validatedData,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning()
    );

    if (newEdge.length === 0) {
      return { success: false, error: "Failed to create edge" };
    }

    // Revalidate canvas page
    revalidatePath("/canvas");

    return { success: true, data: newEdge[0] };
  } catch (error) {
    console.error("Error creating edge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Update an existing edge
export async function updateEdge(
  data: z.infer<typeof updateEdgeSchema>
): Promise<{ success: boolean; data?: Edge; error?: string }> {
  try {
    // Validate input data
    const validatedData = updateEdgeSchema.parse(data);

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Check if edge exists and user has access
    const existingEdge = await db.rls((tx) =>
      tx.select().from(edges).where(eq(edges.id, validatedData.id)).limit(1)
    );

    if (existingEdge.length === 0) {
      return { success: false, error: "Edge not found or access denied" };
    }

    // Update the edge
    const updatedEdge = await db.rls((tx) =>
      tx
        .update(edges)
        .set({
          ...validatedData,
          updated_at: new Date(),
        })
        .where(eq(edges.id, validatedData.id))
        .returning()
    );

    if (updatedEdge.length === 0) {
      return { success: false, error: "Failed to update edge" };
    }

    // Revalidate canvas page
    revalidatePath("/canvas");

    return { success: true, data: updatedEdge[0] };
  } catch (error) {
    console.error("Error updating edge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Delete an edge
export async function deleteEdge(
  edgeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    if (!edgeId || typeof edgeId !== "string") {
      return { success: false, error: "Invalid edge ID" };
    }

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Check if edge exists and user has access
    const existingEdge = await db.rls((tx) =>
      tx.select().from(edges).where(eq(edges.id, edgeId)).limit(1)
    );

    if (existingEdge.length === 0) {
      return { success: false, error: "Edge not found or access denied" };
    }

    // Delete the edge
    await db.rls((tx) => tx.delete(edges).where(eq(edges.id, edgeId)));

    // Revalidate canvas page
    revalidatePath("/canvas");

    return { success: true };
  } catch (error) {
    console.error("Error deleting edge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get edges with optional filters
export async function getEdges(
  data: z.infer<typeof getEdgesSchema>
): Promise<{ success: boolean; data?: Edge[]; error?: string }> {
  try {
    // Validate input data
    const validatedData = getEdgesSchema.parse(data);

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Build query conditions
    const conditions = [];

    if (validatedData.source_node_id) {
      conditions.push(eq(edges.source_node_id, validatedData.source_node_id));
    }

    if (validatedData.target_node_id) {
      conditions.push(eq(edges.target_node_id, validatedData.target_node_id));
    }

    if (validatedData.edge_type) {
      conditions.push(eq(edges.edge_type, validatedData.edge_type));
    }

    // Get edges
    const edgesList = await db.rls((tx) =>
      tx
        .select()
        .from(edges)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(edges.created_at))
    );

    return { success: true, data: edgesList };
  } catch (error) {
    console.error("Error getting edges:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get a single edge by ID
export async function getEdge(
  edgeId: string
): Promise<{ success: boolean; data?: Edge; error?: string }> {
  try {
    // Validate input
    if (!edgeId || typeof edgeId !== "string") {
      return { success: false, error: "Invalid edge ID" };
    }

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Get the edge
    const edge = await db.rls((tx) =>
      tx.select().from(edges).where(eq(edges.id, edgeId)).limit(1)
    );

    if (edge.length === 0) {
      return { success: false, error: "Edge not found or access denied" };
    }

    return { success: true, data: edge[0] };
  } catch (error) {
    console.error("Error getting edge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get edges for a specific node (incoming and outgoing)
export async function getNodeEdges(
  nodeId: string
): Promise<{
  success: boolean;
  data?: { incoming: Edge[]; outgoing: Edge[] };
  error?: string;
}> {
  try {
    // Validate input
    if (!nodeId || typeof nodeId !== "string") {
      return { success: false, error: "Invalid node ID" };
    }

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Check if node exists and user has access
    const node = await db.rls((tx) =>
      tx.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1)
    );

    if (node.length === 0) {
      return { success: false, error: "Node not found or access denied" };
    }

    // Get incoming edges (where this node is the target)
    const incomingEdges = await db.rls((tx) =>
      tx
        .select()
        .from(edges)
        .where(eq(edges.target_node_id, nodeId))
        .orderBy(desc(edges.created_at))
    );

    // Get outgoing edges (where this node is the source)
    const outgoingEdges = await db.rls((tx) =>
      tx
        .select()
        .from(edges)
        .where(eq(edges.source_node_id, nodeId))
        .orderBy(desc(edges.created_at))
    );

    return {
      success: true,
      data: {
        incoming: incomingEdges,
        outgoing: outgoingEdges,
      },
    };
  } catch (error) {
    console.error("Error getting node edges:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
