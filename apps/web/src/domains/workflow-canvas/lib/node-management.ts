import { z } from "zod";
import {
  createBlock,
  updateBlock,
  deleteBlock,
  getBlock,
  getWorkspaceBlocks,
} from "../actions/block.action";
import {
  createEdge,
  deleteEdge,
  getEdgesBySource,
  getEdgesByTarget,
} from "../actions/edge.action";

// Node validation schemas
const nodeValidationSchema = z.object({
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
  metadata: z.record(z.string(), z.any()),
  workspaceId: z.string().uuid(),
});

const agentMetadataSchema = z.object({
  persona: z.string().min(50, "Persona must be at least 50 characters"),
  role: z.string().min(30, "Role must be at least 30 characters"),
  capabilities: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
});

const taskMetadataSchema = z.object({
  instructions: z
    .string()
    .min(100, "Task instructions must be at least 100 characters"),
  variables: z.record(z.string(), z.any()).optional(),
  inputEdges: z.array(z.string()).optional(),
  outputEdges: z.array(z.string()).optional(),
});

const templateMetadataSchema = z.object({
  artifact_format: z.string().min(1, "Artifact format is required"),
  definitions: z.array(z.any()).min(1, "At least one definition is required"),
  layout: z.record(z.string(), z.any()).optional(),
  visual_style: z.record(z.string(), z.any()).optional(),
});

export type NodeValidationInput = z.infer<typeof nodeValidationSchema>;
export type AgentMetadata = z.infer<typeof agentMetadataSchema>;
export type TaskMetadata = z.infer<typeof taskMetadataSchema>;
export type TemplateMetadata = z.infer<typeof templateMetadataSchema>;

/**
 * Node Management Business Logic Class
 */
export class NodeManagementLogic {
  /**
   * Validate node data based on node type
   */
  static async validateNodeData(
    input: NodeValidationInput
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Basic node validation
      nodeValidationSchema.parse(input);

      // Node type specific validation
      switch (input.nodeType) {
        case "agent":
          try {
            agentMetadataSchema.parse(input.metadata);
          } catch (error) {
            if (error instanceof z.ZodError) {
              errors.push(...error.issues.map((e) => e.message));
            }
          }
          break;

        case "task":
          try {
            taskMetadataSchema.parse(input.metadata);
          } catch (error) {
            if (error instanceof z.ZodError) {
              errors.push(...error.issues.map((e) => e.message));
            }
          }
          break;

        case "artifact_template":
          try {
            templateMetadataSchema.parse(input.metadata);
          } catch (error) {
            if (error instanceof z.ZodError) {
              errors.push(...error.issues.map((e) => e.message));
            }
          }
          break;

        default:
          // Other node types have basic validation only
          break;
      }

      // Check for slug uniqueness
      const existingBlocks = await getWorkspaceBlocks(input.workspaceId);
      if (existingBlocks.success) {
        const slugExists = existingBlocks.data.some(
          (block: any) => block.slug === input.slug
        );
        if (slugExists) {
          errors.push("Node with this slug already exists in this workspace");
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map((e) => e.message));
      } else {
        errors.push("Invalid node data");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create node with validation and business rules
   */
  static async createNodeWithValidation(
    input: NodeValidationInput & { position: { x: number; y: number } }
  ) {
    // Validate node data
    const validation = await this.validateNodeData(input);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // Create node
    const result = await createBlock({
      ...input,
      blockType: input.nodeType,
    });
    return result;
  }

  /**
   * Update node with validation
   */
  static async updateNodeWithValidation(
    blockId: string,
    updates: Partial<NodeValidationInput>
  ) {
    // Get existing node
    const existingBlock = await getBlock(blockId);
    if (!existingBlock.success || !existingBlock.data) {
      return {
        success: false,
        error: "Node not found",
      };
    }

    // Merge updates with existing data
    const updatedData = {
      ...existingBlock.data,
      ...updates,
    };

    // Validate updated data
    const validation = await this.validateNodeData(updatedData);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // Update node
    const result = await updateBlock({
      id: blockId,
      ...updates,
    });

    return result;
  }

  /**
   * Delete node and its relationships
   */
  static async deleteNodeWithRelationships(blockId: string) {
    try {
      // Get node edges
      const sourceEdges = await getEdgesBySource(blockId);
      const targetEdges = await getEdgesByTarget(blockId);

      // Delete all related edges
      const edgeDeletions = [
        ...(sourceEdges.data || []).map((edge: any) => deleteEdge(edge.id)),
        ...(targetEdges.data || []).map((edge: any) => deleteEdge(edge.id)),
      ];

      await Promise.all(edgeDeletions);

      // Delete node
      const result = await deleteBlock(blockId);
      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete node with relationships",
      };
    }
  }

  /**
   * Validate node connections
   */
  static async validateNodeConnection(
    sourceBlockId: string,
    targetBlockId: string,
    edgeType: string
  ) {
    const errors: string[] = [];

    // Check if nodes exist
    const sourceBlock = await getBlock(sourceBlockId);
    const targetBlock = await getBlock(targetBlockId);

    if (!sourceBlock.success || !sourceBlock.data) {
      errors.push("Source node not found");
    }

    if (!targetBlock.success || !targetBlock.data) {
      errors.push("Target node not found");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Check for circular dependencies
    if (sourceBlockId === targetBlockId) {
      errors.push("Cannot connect node to itself");
    }

    // Check for existing connections
    const sourceEdges = await getEdgesBySource(sourceBlockId);
    const existingConnection = sourceEdges.data?.find(
      (edge: any) =>
        edge.target_block_id === targetBlockId && edge.edge_type === edgeType
    );

    if (existingConnection) {
      errors.push("Connection already exists between these nodes");
    }

    // Validate edge type based on node types
    const sourceType = sourceBlock.data!.block_type;
    const targetType = targetBlock.data!.block_type;

    switch (edgeType) {
      case "contains":
        // Only workflow nodes can contain other nodes
        if (sourceType !== "workflow") {
          errors.push("Only workflow nodes can contain other nodes");
        }
        break;

      case "next":
        // Task and workflow nodes can have next relationships
        if (!["task", "workflow"].includes(sourceType)) {
          errors.push(
            "Only task and workflow nodes can have next relationships"
          );
        }
        break;

      case "input":
      case "output":
        // Task nodes can have input/output relationships
        if (sourceType !== "task") {
          errors.push("Only task nodes can have input/output relationships");
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create node connection with validation
   */
  static async createNodeConnection(
    sourceBlockId: string,
    targetBlockId: string,
    edgeType: string,
    metadata?: any
  ) {
    // Validate connection
    const validation = await this.validateNodeConnection(
      sourceBlockId,
      targetBlockId,
      edgeType
    );
    if (!validation.valid) {
      return {
        success: false,
        error: `Connection validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // Create edge
    const result = await createEdge({
      sourceBlockId,
      targetBlockId,
      edgeType: edgeType as "contains" | "next" | "input" | "output",
      metadata,
    });

    return result;
  }

  /**
   * Get node hierarchy
   */
  static async getNodeHierarchy(blockId: string) {
    const block = await getBlock(blockId);
    if (!block.success || !block.data) {
      return { success: false, error: "Block not found" };
    }

    const sourceEdges = await getEdgesBySource(blockId);
    const targetEdges = await getEdgesByTarget(blockId);

    return {
      success: true,
      data: {
        block: block.data,
        children: sourceEdges.data || [],
        parents: targetEdges.data || [],
      },
    };
  }

  /**
   * Validate workflow structure
   */
  static async validateWorkflowStructure(workflowNodeId: string) {
    const hierarchy = await this.getNodeHierarchy(workflowNodeId);
    if (!hierarchy.success) {
      return hierarchy;
    }

    const errors: string[] = [];
    const { children } = hierarchy.data!;

    // Check for start and end nodes
    const hasStartNode = children.some(
      (edge: any) =>
        edge.edge_type === "contains" &&
        edge.target_block_id &&
        // This would need to check the actual node type
        true
    );

    const hasEndNode = children.some(
      (edge: any) =>
        edge.edge_type === "contains" &&
        edge.target_node_id &&
        // This would need to check the actual node type
        true
    );

    if (!hasStartNode) {
      errors.push("Workflow must have a start node");
    }

    if (!hasEndNode) {
      errors.push("Workflow must have an end node");
    }

    return {
      valid: errors.length === 0,
      errors,
      data: {
        hasStartNode,
        hasEndNode,
        totalNodes: children.length,
      },
    };
  }
}
