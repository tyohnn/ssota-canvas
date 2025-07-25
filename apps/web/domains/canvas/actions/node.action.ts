"use server";

import { createClerkDrizzleSupabaseClient } from "@/lib/db";
import { nodes, nodePositions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Node creation schema
const createNodeSchema = z.object({
  nodeType: z.enum([
    "agent",
    "task",
    "workflow",
    "artifact_template",
    "checklist",
    "data",
    "artifact_class",
  ]),
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
  parentNodeId: z.string().uuid().optional(),
  workspaceId: z.string().uuid(),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
  }),
});

// Node update schema
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
  parentNodeId: z.string().uuid().optional(),
  position: z
    .object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
    })
    .optional(),
});

// Node position update schema
const updateNodePositionSchema = z.object({
  nodeId: z.string().uuid(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type UpdateNodePositionInput = z.infer<typeof updateNodePositionSchema>;

/**
 * Create a new node with position
 */
export async function createNode(input: CreateNodeInput) {
  try {
    const validatedInput = createNodeSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Check if slug is unique within workspace
    const existingNode = await db.rls(async (tx: any) => {
      return await tx
        .select()
        .from(nodes)
        .where(
          and(
            eq(nodes.slug, validatedInput.slug),
            eq(nodes.workspace_id, validatedInput.workspaceId)
          )
        )
        .limit(1);
    });

    if (existingNode.length > 0) {
      throw new Error("Node with this slug already exists in this workspace");
    }

    // Create node and position in transaction
    const result = await db.rls(async (tx: any) => {
      // Insert node
      const [node] = await tx
        .insert(nodes)
        .values({
          node_type: validatedInput.nodeType,
          slug: validatedInput.slug,
          name: validatedInput.name,
          metadata: validatedInput.metadata,
          parent_node_id: validatedInput.parentNodeId,
          workspace_id: validatedInput.workspaceId,
        })
        .returning();

      // Insert position
      await tx.insert(nodePositions).values({
        node_id: node.id,
        x_position: validatedInput.position.x,
        y_position: validatedInput.position.y,
      });

      return node;
    });

    revalidatePath("/canvas");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating node:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create node",
    };
  }
}

/**
 * Get node by ID with position
 */
export async function getNode(nodeId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      const [node] = await tx
        .select()
        .from(nodes)
        .where(eq(nodes.id, nodeId))
        .limit(1);

      if (!node) return null;

      const [position] = await tx
        .select()
        .from(nodePositions)
        .where(eq(nodePositions.node_id, nodeId))
        .limit(1);

      return {
        ...node,
        position: position
          ? { x: position.x_position, y: position.y_position }
          : null,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting node:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get node",
    };
  }
}

/**
 * Get all nodes for a workspace with positions
 */
export async function getWorkspaceNodes(workspaceId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      const nodesData = await tx
        .select()
        .from(nodes)
        .where(eq(nodes.workspace_id, workspaceId))
        .orderBy(desc(nodes.created_at));

      const positionsData = await tx
        .select()
        .from(nodePositions)
        .where(
          eq(
            nodePositions.node_id,
            nodesData.map((n: any) => n.id)
          )
        );

      // Create position lookup map
      const positionMap = new Map(
        positionsData.map((p: any) => [
          p.node_id,
          { x: p.x_position, y: p.y_position },
        ])
      );

      // Combine nodes with positions
      return nodesData.map((node: any) => ({
        ...node,
        position: positionMap.get(node.id) || null,
      }));
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting workspace nodes:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get workspace nodes",
    };
  }
}

/**
 * Update node
 */
export async function updateNode(input: UpdateNodeInput) {
  try {
    const validatedInput = updateNodeSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Check if slug is unique within workspace (if slug is being updated)
    if (validatedInput.slug) {
      const existingNode = await db.rls(async (tx: any) => {
        return await tx
          .select()
          .from(nodes)
          .where(
            and(
              eq(nodes.slug, validatedInput.slug!),
              eq(nodes.id, validatedInput.id)
            )
          )
          .limit(1);
      });

      if (existingNode.length > 0) {
        throw new Error("Node with this slug already exists in this workspace");
      }
    }

    const result = await db.rls(async (tx: any) => {
      const updateData: any = {};
      if (validatedInput.slug) updateData.slug = validatedInput.slug;
      if (validatedInput.name) updateData.name = validatedInput.name;
      if (validatedInput.metadata)
        updateData.metadata = validatedInput.metadata;
      if (validatedInput.parentNodeId !== undefined)
        updateData.parent_node_id = validatedInput.parentNodeId;
      updateData.updated_at = new Date();

      const [node] = await tx
        .update(nodes)
        .set(updateData)
        .where(eq(nodes.id, validatedInput.id))
        .returning();

      return node;
    });

    revalidatePath("/canvas");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating node:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update node",
    };
  }
}

/**
 * Update node position
 */
export async function updateNodePosition(input: UpdateNodePositionInput) {
  try {
    const validatedInput = updateNodePositionSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      const [position] = await tx
        .update(nodePositions)
        .set({
          x_position: validatedInput.x,
          y_position: validatedInput.y,
        })
        .where(eq(nodePositions.node_id, validatedInput.nodeId))
        .returning();

      return position;
    });

    revalidatePath("/canvas");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating node position:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update node position",
    };
  }
}

/**
 * Delete node and its position
 */
export async function deleteNode(nodeId: string) {
  try {
    const db = await createClerkDrizzleSupabaseClient();

    const result = await db.rls(async (tx: any) => {
      // Delete position first (due to foreign key constraint)
      await tx.delete(nodePositions).where(eq(nodePositions.node_id, nodeId));

      // Delete node
      const [node] = await tx
        .delete(nodes)
        .where(eq(nodes.id, nodeId))
        .returning();

      return node;
    });

    revalidatePath("/canvas");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error deleting node:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete node",
    };
  }
}

/**
 * Get nodes by type for a workspace
 */
export async function getNodesByType(
  workspaceId: string,
  nodeType:
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
        .from(nodes)
        .where(
          and(
            eq(nodes.workspace_id, workspaceId),
            eq(nodes.node_type, nodeType)
          )
        )
        .orderBy(desc(nodes.created_at));
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting nodes by type:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get nodes by type",
    };
  }
}
