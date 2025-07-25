"use client";

import { useState, useCallback } from "react";
import { Node } from "@xyflow/react";
import {
  createNode,
  updateNode,
  deleteNode,
  getNode,
  updateNodePosition,
} from "../actions/node.action";
import { NodeManagementLogic } from "../lib/node-management";

// Node operation state
export interface NodeOperationState {
  loading: boolean;
  error: string | null;
  lastOperation: "create" | "update" | "delete" | "move" | null;
  validationErrors: string[];
}

// Node creation input
export interface CreateNodeInput {
  nodeType:
    | "agent"
    | "task"
    | "workflow"
    | "artifact_template"
    | "checklist"
    | "data"
    | "artifact_class";
  slug: string;
  name: string;
  metadata: Record<string, any>;
  parentNodeId?: string;
  workspaceId: string;
  position: { x: number; y: number };
}

// Node update input
export interface UpdateNodeInput {
  id: string;
  slug?: string;
  name?: string;
  metadata?: Record<string, any>;
  parentNodeId?: string;
  position?: { x: number; y: number };
}

/**
 * Custom hook for node operations
 */
export function useNodeOperations() {
  const [state, setState] = useState<NodeOperationState>({
    loading: false,
    error: null,
    lastOperation: null,
    validationErrors: [],
  });

  // Create node with validation
  const createNodeWithValidation = useCallback(
    async (input: CreateNodeInput) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        validationErrors: [],
      }));

      try {
        // Validate node data
        const validation = await NodeManagementLogic.validateNodeData({
          nodeType: input.nodeType,
          slug: input.slug,
          name: input.name,
          metadata: input.metadata,
          workspaceId: input.workspaceId,
        });

        if (!validation.valid) {
          setState((prev) => ({
            ...prev,
            loading: false,
            validationErrors: validation.errors,
            lastOperation: null,
          }));
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(", ")}`,
          };
        }

        // Create node
        const result = await createNode(input);

        setState((prev) => ({
          ...prev,
          loading: false,
          lastOperation: "create",
          error: result.success
            ? null
            : result.error || "Failed to create node",
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create node";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          lastOperation: null,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Update node with validation
  const updateNodeWithValidation = useCallback(
    async (input: UpdateNodeInput) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        validationErrors: [],
      }));

      try {
        // Get existing node for validation
        const existingNode = await getNode(input.id);
        if (!existingNode.success || !existingNode.data) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Node not found",
            lastOperation: null,
          }));
          return { success: false, error: "Node not found" };
        }

        // Prepare update data
        const updateData = {
          nodeType: existingNode.data.node_type,
          slug: input.slug || existingNode.data.slug,
          name: input.name || existingNode.data.name,
          metadata: input.metadata || existingNode.data.metadata,
          workspaceId: existingNode.data.workspace_id,
        };

        // Validate updated data
        const validation =
          await NodeManagementLogic.validateNodeData(updateData);

        if (!validation.valid) {
          setState((prev) => ({
            ...prev,
            loading: false,
            validationErrors: validation.errors,
            lastOperation: null,
          }));
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(", ")}`,
          };
        }

        // Update node
        const result = await updateNode(input);

        setState((prev) => ({
          ...prev,
          loading: false,
          lastOperation: "update",
          error: result.success
            ? null
            : result.error || "Failed to update node",
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update node";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          lastOperation: null,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Delete node with relationships
  const deleteNodeWithRelationships = useCallback(async (nodeId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result =
        await NodeManagementLogic.deleteNodeWithRelationships(nodeId);

      setState((prev) => ({
        ...prev,
        loading: false,
        lastOperation: "delete",
        error: result.success ? null : result.error || "Failed to delete node",
      }));

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete node";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastOperation: null,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Move node
  const moveNode = useCallback(
    async (nodeId: string, position: { x: number; y: number }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await updateNodePosition({
          nodeId,
          x: position.x,
          y: position.y,
        });

        setState((prev) => ({
          ...prev,
          loading: false,
          lastOperation: "move",
          error: result.success ? null : result.error || "Failed to move node",
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to move node";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          lastOperation: null,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Validate node data
  const validateNodeData = useCallback(
    async (input: Omit<CreateNodeInput, "position">) => {
      setState((prev) => ({ ...prev, error: null, validationErrors: [] }));

      try {
        const validation = await NodeManagementLogic.validateNodeData(input);

        setState((prev) => ({
          ...prev,
          validationErrors: validation.errors,
        }));

        return validation;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Validation failed";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        return { valid: false, errors: [errorMessage] };
      }
    },
    []
  );

  // Validate node connection
  const validateNodeConnection = useCallback(
    async (sourceNodeId: string, targetNodeId: string, edgeType: string) => {
      setState((prev) => ({ ...prev, error: null }));

      try {
        const validation = await NodeManagementLogic.validateNodeConnection(
          sourceNodeId,
          targetNodeId,
          edgeType
        );

        setState((prev) => ({
          ...prev,
          error: validation.valid ? null : validation.errors.join(", "),
        }));

        return validation;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Connection validation failed";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        return { valid: false, errors: [errorMessage] };
      }
    },
    []
  );

  // Create node connection
  const createNodeConnection = useCallback(
    async (
      sourceNodeId: string,
      targetNodeId: string,
      edgeType: string,
      metadata?: any
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await NodeManagementLogic.createNodeConnection(
          sourceNodeId,
          targetNodeId,
          edgeType,
          metadata
        );

        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.success
            ? null
            : result.error || "Failed to create connection",
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to create connection";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Get node hierarchy
  const getNodeHierarchy = useCallback(async (nodeId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await NodeManagementLogic.getNodeHierarchy(nodeId);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: result.success
          ? null
          : result.error || "Failed to get node hierarchy",
      }));

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get node hierarchy";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Validate workflow structure
  const validateWorkflowStructure = useCallback(
    async (workflowNodeId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result =
          await NodeManagementLogic.validateWorkflowStructure(workflowNodeId);

        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'valid' in result && result.valid ? null : 'errors' in result ? result.errors.join(", ") : result.error || "Validation failed",
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to validate workflow structure";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return { valid: false, errors: [errorMessage] };
      }
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, validationErrors: [] }));
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      lastOperation: null,
      validationErrors: [],
    });
  }, []);

  return {
    // State
    ...state,

    // Node operations
    createNodeWithValidation,
    updateNodeWithValidation,
    deleteNodeWithRelationships,
    moveNode,

    // Validation operations
    validateNodeData,
    validateNodeConnection,
    createNodeConnection,

    // Hierarchy operations
    getNodeHierarchy,
    validateWorkflowStructure,

    // Utility operations
    clearError,
    resetState,
  };
}
