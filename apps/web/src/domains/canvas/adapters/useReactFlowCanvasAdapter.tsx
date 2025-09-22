"use client";

import { useCallback, useMemo } from "react";
import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from "@xyflow/react";
import type { Block, BlockPosition, Edge as DbEdge } from "@/db/schema";
import type { BlockWithPosition } from "@/domains/canvas/actions/block-position.action";
import { 
  transformBlockToReactFlowNode,
} from "@/domains/react-flow-canvas/policy/node-rendering-policy";
import {
  isComponentInstance,
  extractComponentDefinitions,
  type ComponentDefinition,
} from "@/domains/block-components";
import type { CanvasDataContextValue } from "../contexts/CanvasDataContext";


// React Flow Canvas 상태 (어댑터 출력)
export interface ReactFlowCanvasState {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

// 어댑터 결과
export interface UseReactFlowCanvasAdapterResult {
  getReactFlowState: (
    blocksWithPositions: BlockWithPosition[],
    edges: DbEdge[],
    canvasData: CanvasDataContextValue
  ) => ReactFlowCanvasState;
}

/**
 * Canvas 도메인을 React Flow Canvas와 연결하는 어댑터
 */
export function useReactFlowCanvasAdapter(): UseReactFlowCanvasAdapterResult {
  const getReactFlowState = useCallback((
    blocksWithPositions: BlockWithPosition[],
    edges: DbEdge[],
    canvasData: CanvasDataContextValue
  ): ReactFlowCanvasState => {
    // Extract component definitions optimized by Canvas Mode
    let componentDefinitions: ComponentDefinition[];
    
    if (canvasData.canvasMode === "component") {
      // Component mode: Load all definitions for comprehensive editing
      componentDefinitions = extractComponentDefinitions(canvasData.componentBlocks);
    } else {
      // Page mode: Only load definitions needed by current blocks
      const requiredDefinitionIds = new Set<string>();
      blocksWithPositions.forEach(({ block }) => {
        if (isComponentInstance(block)) {
          requiredDefinitionIds.add(block.metadata.instanceData.componentId);
        }
      });
      
      componentDefinitions = extractComponentDefinitions(canvasData.componentBlocks)
        .filter(def => requiredDefinitionIds.has(def.id));
    }

    const componentDefinitionsById = componentDefinitions.reduce(
      (map, def) => {
        map[def.id] = def;
        return map;
      },
      {} as Record<string, ComponentDefinition>
    );

    if (blocksWithPositions.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Transform blocks with positions to React Flow nodes using the optimized transformer
    const nodes: ReactFlowNode[] = blocksWithPositions
      .map(({ block, position }) => 
        transformBlockToReactFlowNode(block, position, componentDefinitionsById)
      )
      .filter(Boolean);

    // Build edges
    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const rfEdges: ReactFlowEdge[] = (edges || [])
      .filter((e) => !!e.source_block_id && !!e.target_block_id)
      // Scope edges to current page: both endpoints must exist in page nodes
      .filter(
        (e) =>
          nodeIdSet.has(e.source_block_id as string) &&
          nodeIdSet.has(e.target_block_id as string)
      )
      .map((e) => ({
        id: e.id as string,
        source: e.source_block_id as string,
        target: e.target_block_id as string,
        type: (e.edge_type as string) || "default",
        data: {
          relationship_type: e.edge_type as string,
          ...((e.metadata as any) || {}),
        },
      }));

    return { nodes, edges: rfEdges };
  }, []);

  return {
    getReactFlowState,
  };
}



