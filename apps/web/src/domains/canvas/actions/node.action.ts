"use server";

import { createClerkDrizzleSupabaseClient } from "@/lib/db";
import { nodes, workspaces, Node, NewNode } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const createNodeSchema = z.object({
  node_type: z.enum([
    "agent",
    "task",
    "workflow",
    "artifact_template",
    "checklist",
    "data",
    "artifact_class",
    "node_definition",
    "edge_definition",
    "column_definition",
  ] as const),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  name: z.string().min(1).max(100),
  metadata: z.record(z.any()),
  parent_node_id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
});

const updateNodeSchema = z.object({
  id: z.string().uuid(),
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
  metadata: z.record(z.any()).optional(),
  parent_node_id: z.string().uuid().optional(),
});

const getNodesSchema = z.object({
  workspace_id: z.string().uuid(),
  node_type: z
    .enum([
      "agent",
      "task",
      "workflow",
      "artifact_template",
      "checklist",
      "data",
      "artifact_class",
      "node_definition",
      "edge_definition",
      "column_definition",
    ])
    .optional(),
  parent_node_id: z.string().uuid().optional(),
});

// Create a new node
export async function createNode(
  data: z.infer<typeof createNodeSchema>
): Promise<{ success: boolean; data?: Node; error?: string }> {
  try {
    // Validate input data
    const validatedData = createNodeSchema.parse(data);

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Check if workspace exists and user has access
    const workspace = await db.rls((tx) =>
      tx
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, validatedData.workspace_id))
        .limit(1)
    );

    if (workspace.length === 0) {
      return { success: false, error: "Workspace not found or access denied" };
    }

    // Check if slug is unique within workspace
    const existingNode = await db.rls((tx) =>
      tx
        .select()
        .from(nodes)
        .where(
          and(
            eq(nodes.slug, validatedData.slug),
            eq(nodes.workspace_id, validatedData.workspace_id)
          )
        )
        .limit(1)
    );

    if (existingNode.length > 0) {
      return {
        success: false,
        error: "Node with this slug already exists in this workspace",
      };
    }

    // Validate parent node if provided
    if (validatedData.parent_node_id) {
      const parentNode = await db.rls((tx) =>
        tx
          .select()
          .from(nodes)
          .where(eq(nodes.id, validatedData.parent_node_id!))
          .limit(1)
      );

      if (parentNode.length === 0) {
        return { success: false, error: "Parent node not found" };
      }
    }

    // Create the node
    const newNode = await db.rls((tx) =>
      tx
        .insert(nodes)
        .values({
          ...validatedData,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning()
    );

    if (newNode.length === 0) {
      return { success: false, error: "Failed to create node" };
    }

    // Revalidate canvas page
    revalidatePath("/canvas");

    return { success: true, data: newNode[0] };
  } catch (error) {
    console.error("Error creating node:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Update an existing node
export async function updateNode(
  data: z.infer<typeof updateNodeSchema>
): Promise<{ success: boolean; data?: Node; error?: string }> {
  try {
    // Validate input data
    const validatedData = updateNodeSchema.parse(data);

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Check if node exists and user has access
    const existingNode = await db.rls((tx) =>
      tx.select().from(nodes).where(eq(nodes.id, validatedData.id)).limit(1)
    );

    if (existingNode.length === 0) {
      return { success: false, error: "Node not found or access denied" };
    }

    const node = existingNode[0];

    if (!node) {
      return { success: false, error: "Node not found or access denied" };
    }

    // Check slug uniqueness if slug is being updated
    if (validatedData.slug && validatedData.slug !== node.slug) {
      const duplicateNode = await db.rls((tx) =>
        tx
          .select()
          .from(nodes)
          .where(
            and(
              eq(nodes.slug, validatedData.slug!),
              eq(nodes.workspace_id, node.workspace_id),
              eq(nodes.id, validatedData.id)
            )
          )
          .limit(1)
      );

      if (duplicateNode.length > 0) {
        return {
          success: false,
          error: "Node with this slug already exists in this workspace",
        };
      }
    }

    // Validate parent node if being updated
    if (
      validatedData.parent_node_id &&
      validatedData.parent_node_id !== node.parent_node_id
    ) {
      // Prevent self-reference
      if (validatedData.parent_node_id === validatedData.id) {
        return {
          success: false,
          error: "Node cannot reference itself as parent",
        };
      }

      const parentNode = await db.rls((tx) =>
        tx
          .select()
          .from(nodes)
          .where(eq(nodes.id, validatedData.parent_node_id!))
          .limit(1)
      );

      if (parentNode.length === 0) {
        return { success: false, error: "Parent node not found" };
      }
    }

    // Update the node
    const updatedNode = await db.rls((tx) =>
      tx
        .update(nodes)
        .set({
          ...validatedData,
          updated_at: new Date(),
        })
        .where(eq(nodes.id, validatedData.id))
        .returning()
    );

    if (updatedNode.length === 0) {
      return { success: false, error: "Failed to update node" };
    }

    // Revalidate canvas page
    revalidatePath("/canvas");

    return { success: true, data: updatedNode[0] };
  } catch (error) {
    console.error("Error updating node:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Delete a node
export async function deleteNode(
  nodeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    if (!nodeId || typeof nodeId !== "string") {
      return { success: false, error: "Invalid node ID" };
    }

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Check if node exists and user has access
    const existingNode = await db.rls((tx) =>
      tx.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1)
    );

    if (existingNode.length === 0) {
      return { success: false, error: "Node not found or access denied" };
    }

    // Delete the node (cascade will handle related edges and positions)
    await db.rls((tx) => tx.delete(nodes).where(eq(nodes.id, nodeId)));

    // Revalidate canvas page
    revalidatePath("/canvas");

    return { success: true };
  } catch (error) {
    console.error("Error deleting node:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get nodes for a workspace
export async function getNodes(
  data: z.infer<typeof getNodesSchema>
): Promise<{ success: boolean; data?: Node[]; error?: string }> {
  try {
    // Validate input data
    const validatedData = getNodesSchema.parse(data);

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Check if workspace exists and user has access
    const workspace = await db.rls((tx) =>
      tx
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, validatedData.workspace_id))
        .limit(1)
    );

    if (workspace.length === 0) {
      return { success: false, error: "Workspace not found or access denied" };
    }

    // Build query conditions
    const conditions = [eq(nodes.workspace_id, validatedData.workspace_id)];

    if (validatedData.node_type) {
      conditions.push(eq(nodes.node_type, validatedData.node_type));
    }

    if (validatedData.parent_node_id) {
      conditions.push(eq(nodes.parent_node_id, validatedData.parent_node_id));
    }

    // Get nodes
    const nodesList = await db.rls((tx) =>
      tx
        .select()
        .from(nodes)
        .where(and(...conditions))
        .orderBy(desc(nodes.created_at))
    );

    return { success: true, data: nodesList };
  } catch (error) {
    console.error("Error getting nodes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get a single node by ID
export async function getNode(
  nodeId: string
): Promise<{ success: boolean; data?: Node; error?: string }> {
  try {
    // Validate input
    if (!nodeId || typeof nodeId !== "string") {
      return { success: false, error: "Invalid node ID" };
    }

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Get the node
    const node = await db.rls((tx) =>
      tx.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1)
    );

    if (node.length === 0) {
      return { success: false, error: "Node not found or access denied" };
    }

    return { success: true, data: node[0] };
  } catch (error) {
    console.error("Error getting node:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get nodes by type for a workspace
export async function getNodesByType(
  workspaceId: string,
  nodeType: string
): Promise<{ success: boolean; data?: Node[]; error?: string }> {
  try {
    // Validate input
    if (!workspaceId || typeof workspaceId !== "string") {
      return { success: false, error: "Invalid workspace ID" };
    }

    if (!nodeType || typeof nodeType !== "string") {
      return { success: false, error: "Invalid node type" };
    }

    // Get database client
    const db = await createClerkDrizzleSupabaseClient();

    // Get nodes by type
    const nodesList = await db.rls((tx) =>
      tx
        .select()
        .from(nodes)
        .where(
          and(
            eq(nodes.workspace_id, workspaceId),
            eq(nodes.node_type, nodeType as any)
          )
        )
        .orderBy(desc(nodes.created_at))
    );

    return { success: true, data: nodesList };
  } catch (error) {
    console.error("Error getting nodes by type:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
