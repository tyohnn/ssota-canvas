"use client";

import { useCallback } from "react";
import { useReactFlow, Node } from "@xyflow/react";
import { updateBlock as updateBlockAction } from "@/domains/canvas/actions/block.action";
import { isFailure } from "@/lib/action-result";
import type { CreateStatus } from "./useReactFlowBlockCommands";
import type { AllNodeUIProperties, NodeUI, ReactFlowNodeData, BlockType } from "@/domains/blocks/types/common.node";
import { useReactFlowNodeCommands } from "./useReactFlowNodeCommands";
import { extractUserDefinedSchema } from "../policy/node-form-schema-policy";

/**
 * React Flow Style Commands Hook
 * 
 * This hook handles UI styling operations for React Flow nodes.
 * Uses updateNodeData from useReactFlowNodeCommands for consistent optimistic updates.
 * Accepts Node objects directly for better performance and testability.
 */
export function useReactFlowStyleCommands() {
  const { getNode, updateNode } = useReactFlow();
  const { updateNodeData } = useReactFlowNodeCommands();

  // ============================================================================
  // Shape & Color Styling
  // ============================================================================

  /**
   * Update node shape (Node object version)
   */
  const updateShape = useCallback(async (
    node: Node | Pick<Node, "id" | "type" | "data">,
    shape: AllNodeUIProperties["shape"]
  ): Promise<CreateStatus> => {
    return updateNodeData(node, {
      nodeUI: {
        ...node.data.nodeUI as NodeUI,
        shape,
      },
    });
  }, [updateNodeData]);

  /**
   * Update node shape (nodeId version - backward compatibility)
   */
  const updateShapeById = useCallback(async (
    nodeId: string,
    shape: AllNodeUIProperties["shape"]
  ): Promise<CreateStatus> => {
    const node = getNode(nodeId);
    if (!node) {
      return { ok: false, error: `Node ${nodeId} not found` };
    }
    return updateShape(node, shape);
  }, [getNode, updateShape]);

  /**
   * Update node color (Node object version)
   */
  const updateColor = useCallback(async (
    node: Node | Pick<Node, "id" | "type" | "data">,
    color: AllNodeUIProperties["color"]
  ): Promise<CreateStatus> => {
    return updateNodeData(node, {
      nodeUI: {
        ...node.data.nodeUI as NodeUI,
        color,
      },
    });
  }, [updateNodeData]);

  /**
   * Update node color (nodeId version - backward compatibility)
   */
  const updateColorById = useCallback(async (
    nodeId: string,
    color: AllNodeUIProperties["color"]
  ): Promise<CreateStatus> => {
    const node = getNode(nodeId);
    if (!node) {
      return { ok: false, error: `Node ${nodeId} not found` };
    }
    return updateColor(node, color);
  }, [getNode, updateColor]);

  // ============================================================================
  // Size & Layout Styling
  // ============================================================================

  /**
   * Update node size (Node object version)
   */
  const updateSize = useCallback(async (
    node: Node | Pick<Node, "id" | "type" | "data">,
    size: Partial<AllNodeUIProperties["size"]>
  ): Promise<CreateStatus> => {
    const originalData = { ...node.data } as ReactFlowNodeData;
    const originalSize = { ...(node.data.nodeUI as NodeUI).size };
    const newSize = {
      ...originalSize,
      ...size,
    };

    // 업데이트된 데이터 직접 생성
    const updatedData: ReactFlowNodeData = {
      ...originalData,
      nodeUI: {
        ...originalData.nodeUI as NodeUI,
        size: newSize,
      },
    };

    try {
      // 1. Update React Flow Node immediately (optimistic update)
      // Update both nodeUI.size and node width/height
      updateNode(node.id, {
        data: updatedData,
        width: newSize.width,
        // height: newSize.height,
      });

      // 2. Sync to database with directly constructed data
      const dbPayload = {
        id: node.id,
        metadata: {
          formData: updatedData.formData,
          formSchema: extractUserDefinedSchema(node.type as BlockType, updatedData.formSchema),
          nodeUI: updatedData.nodeUI,
          componentData: updatedData.componentData,
          pageData: updatedData.pageData,
          instanceData: updatedData.instanceData,
        },
      };
      
      const dbResult = await updateBlockAction(dbPayload);

      if (isFailure(dbResult)) {
        // Rollback optimistic update
        updateNode(node.id, {
          data: originalData,
          width: originalSize.width,
          // height: originalSize.height,
        });
        return { ok: false, error: dbResult.error || "Failed to update size in database" };
      }

      return { ok: true, data: { nodeId: node.id, size: newSize } };
      
    } catch (error) {
      // Rollback optimistic update
      updateNode(node.id, {
        data: originalData,
        width: originalSize.width,
        // height: originalSize.height,
      });
      console.error("❌ Failed to update size:", error);
      return { ok: false, error: `Failed to update size: ${error instanceof Error ? error.message : String(error)}` };
    }
  }, [updateNode]);

  /**
   * Update node size (nodeId version - backward compatibility)
   */
  const updateSizeById = useCallback(async (
    nodeId: string,
    size: Partial<AllNodeUIProperties["size"]>
  ): Promise<CreateStatus> => {
    const node = getNode(nodeId);
    if (!node) {
      return { ok: false, error: `Node ${nodeId} not found` };
    }
    return updateSize(node, size);
  }, [getNode, updateSize]);

  // ============================================================================
  // Typography Styling
  // ============================================================================

  /**
   * Update font size (Node object version)
   */
  const updateFontSize = useCallback(async (
    node: Node | Pick<Node, "id" | "type" | "data">,
    fontSize: AllNodeUIProperties["fontSize"]
  ): Promise<CreateStatus> => {
    return updateNodeData(node, {
      nodeUI: {
        ...node.data.nodeUI as NodeUI,
        fontSize,
      },
    });
  }, [updateNodeData]);

  /**
   * Update font size (nodeId version - backward compatibility)
   */
  const updateFontSizeById = useCallback(async (
    nodeId: string,
    fontSize: AllNodeUIProperties["fontSize"]
  ): Promise<CreateStatus> => {
    const node = getNode(nodeId);
    if (!node) {
      return { ok: false, error: `Node ${nodeId} not found` };
    }
    return updateFontSize(node, fontSize);
  }, [getNode, updateFontSize]);

  /**
   * Update font weight (Node object version)
   */
  const updateFontWeight = useCallback(async (
    node: Node | Pick<Node, "id" | "type" | "data">,
    weight: AllNodeUIProperties["weight"]
  ): Promise<CreateStatus> => {
    return updateNodeData(node, {
      nodeUI: {
        ...node.data.nodeUI as NodeUI,
        weight,
      },
    });
  }, [updateNodeData]);

  /**
   * Update font weight (nodeId version - backward compatibility)
   */
  const updateFontWeightById = useCallback(async (
    nodeId: string,
    weight: AllNodeUIProperties["weight"]
  ): Promise<CreateStatus> => {
    const node = getNode(nodeId);
    if (!node) {
      return { ok: false, error: `Node ${nodeId} not found` };
    }
    return updateFontWeight(node, weight);
  }, [getNode, updateFontWeight]);

  // ============================================================================
  // Batch Style Updates
  // ============================================================================

  /**
   * Update multiple style properties at once (Node object version)
   */
  const updateStyles = useCallback(async (
    node: Node | Pick<Node, "id" | "type" | "data">,
    styles: Partial<AllNodeUIProperties>
  ): Promise<CreateStatus> => {
      return updateNodeData(node, {
      nodeUI: {
        ...node.data.nodeUI as NodeUI,
        ...styles,
      },
    });
  }, [updateNodeData]);

  /**
   * Update multiple style properties at once (nodeId version - backward compatibility)
   */
  const updateStylesById = useCallback(async (
    nodeId: string,
    styles: Partial<AllNodeUIProperties>
  ): Promise<CreateStatus> => {
    const node = getNode(nodeId);
    if (!node) {
      return { ok: false, error: `Node ${nodeId} not found` };
    }
    return updateStyles(node, styles);
  }, [getNode, updateStyles]);

  /**
   * Batch update styles for multiple nodes
   */
  const batchUpdateStyles = useCallback(async (
    updates: Array<{ node: Node; styles: Partial<AllNodeUIProperties> }>
  ): Promise<CreateStatus> => {
    if (updates.length === 0) {
      return { ok: false, error: "No updates provided" };
    }

    try {
      // Process all updates sequentially
      const results = await Promise.all(
        updates.map(({ node, styles }) => updateStyles(node, styles))
      );

      // Check for failures
      const failedResults = results.filter(result => !result.ok);
      if (failedResults.length > 0) {
        const errors = failedResults.map(result => result.error).join(", ");
        return { ok: false, error: errors || "Failed to batch update styles" };
      }

      console.log("✅ Styles batch updated successfully:", updates.length, "nodes");
      return { ok: true, data: { count: updates.length } };
      
    } catch (error) {
      console.error("❌ Failed to batch update styles:", error);
      return { ok: false, error: `Failed to batch update styles: ${error instanceof Error ? error.message : String(error)}` };
    }
  }, [updateStyles]);

  /**
   * Batch update styles for multiple nodes (nodeId version - backward compatibility)
   */
  const batchUpdateStylesById = useCallback(async (
    updates: Array<{ nodeId: string; styles: Partial<AllNodeUIProperties> }>
  ): Promise<CreateStatus> => {
    const nodeUpdates = updates.map(({ nodeId, styles }) => {
      const node = getNode(nodeId);
      if (!node) {
        return null;
      }
      return { node, styles };
    }).filter(Boolean) as Array<{ node: Node; styles: Partial<AllNodeUIProperties> }>;

    if (nodeUpdates.length !== updates.length) {
      return { ok: false, error: "Some nodes not found" };
    }

    return batchUpdateStyles(nodeUpdates);
  }, [getNode, batchUpdateStyles]);

  // ============================================================================
  // Style Presets & Utilities
  // ============================================================================

  /**
   * Apply a predefined style preset (Node object version)
   */
  const applyStylePreset = useCallback(async (
    node: Node | Pick<Node, "id" | "type" | "data">,
    presetName: string
  ): Promise<CreateStatus> => {
    // Define style presets
    const presets: Record<string, Partial<AllNodeUIProperties>> = {
      small: {
        size: { width: 120, height: 80 },
        fontSize: "24px",
      },
      medium: {
        size: { width: 200, height: 120 },
        fontSize: "32px",
      },
      large: {
        size: { width: 300, height: 180 },
        fontSize: "48px",
      },
      primary: {
        color: "#3B82F6",
        weight: "bold",
      },
      secondary: {
        color: "#6B7280",
        weight: "normal",
      },
      success: {
        color: "#10B981",
        weight: "bold",
      },
      warning: {
        color: "#F59E0B",
        weight: "bold",
      },
      error: {
        color: "#EF4444",
        weight: "bold",
      },
    };

    const preset = presets[presetName];
    if (!preset) {
      return { ok: false, error: `Style preset '${presetName}' not found` };
    }

    return updateStyles(node, preset);
  }, [updateStyles]);

  /**
   * Apply a predefined style preset (nodeId version - backward compatibility)
   */
  const applyStylePresetById = useCallback(async (
    nodeId: string,
    presetName: string
  ): Promise<CreateStatus> => {
    const node = getNode(nodeId);
    if (!node) {
      return { ok: false, error: `Node ${nodeId} not found` };
    }
    return applyStylePreset(node, presetName);
  }, [getNode, applyStylePreset]);


  return {
    // Shape & Color (Node object versions)
    updateShape,
    updateColor,
    
    // Shape & Color (nodeId versions - backward compatibility)
    updateShapeById,
    updateColorById,
    
    // Size & Layout (Node object versions)
    updateSize,
    
    // Size & Layout (nodeId versions - backward compatibility)
    updateSizeById,
    
    // Typography (Node object versions)
    updateFontSize,
    updateFontWeight,
    
    // Typography (nodeId versions - backward compatibility)
    updateFontSizeById,
    updateFontWeightById,
    
    // Batch Updates (Node object versions)
    updateStyles,
    batchUpdateStyles,
    
    // Batch Updates (nodeId versions - backward compatibility)
    updateStylesById,
    batchUpdateStylesById,
    
    // Style Presets (Node object versions)
    applyStylePreset,
    
    // Style Presets (nodeId versions - backward compatibility)
    applyStylePresetById,
  };
}
