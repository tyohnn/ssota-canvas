"use client";

import { useEffect, useMemo, useReducer } from "react";
import type { Block, BlockPosition, Edge as DbEdge } from "@/db/schema";
import type {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
} from "@xyflow/react";
import { buildNodeDefinition } from "@/domains/canvas/policy/block-rendering-policy";
import {
  isComponentInstance,
  isComponentDefinition,
  resolveNodeStyle,
  extractComponentDefinitions,
  type ComponentDefinition,
} from "@/domains/canvas/types/component";

type State = { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] };
type Action = {
  type: "SET_FROM_PAGE";
  payload: {
    blockById: Record<string, Block>;
    positions: BlockPosition[];
    contextPageId: string | null;
    dbEdges: DbEdge[];
    selectedNodeIds: string[];
    componentDefinitionsById?: Record<string, ComponentDefinition>;
  };
};

const initial: State = { nodes: [], edges: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FROM_PAGE": {
      const {
        blockById,
        positions,
        contextPageId,
        dbEdges,
        selectedNodeIds,
        componentDefinitionsById = {},
      } = action.payload;

      if (!contextPageId) return { ...state, nodes: [] };

      const filtered = positions.filter(
        (p) => (p.context_block_id as string) === contextPageId
      );

      const nodes: ReactFlowNode[] = filtered
        .map((p) => {
          const block = blockById[p.block_id as string];
          if (!block) return null;

          // Use component-aware node building
          const { nodeType, data } = buildComponentAwareNodeDefinition(
            block,
            componentDefinitionsById
          );

          const w = (data as any)?.width as number | undefined;
          const h = (data as any)?.height as number | undefined;

          // Add component-specific metadata to node data
          const enhancedData = {
            ...data,
            __isComponentInstance: isComponentInstance(block),
            __isComponentDefinition: isComponentDefinition(block),
            __componentStatus: getComponentNodeStatus(
              block,
              componentDefinitionsById
            ),
          };

          return {
            id: block.id as string,
            type: nodeType,
            position: {
              x: Number(p.x_position) || 0,
              y: Number(p.y_position) || 0,
            },
            data: enhancedData,
            style:
              typeof w === "number" && typeof h === "number"
                ? { width: w, height: h }
                : undefined,
            selected: selectedNodeIds.includes(block.id as string),
          } as ReactFlowNode;
        })
        .filter(Boolean) as ReactFlowNode[];
      const nodeIdSet = new Set(nodes.map((n) => n.id));
      const rfEdges: ReactFlowEdge[] = (dbEdges || [])
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
    }
    default:
      return state;
  }
}

export function useReactFlowViewModel(
  blockById: Record<string, Block>,
  positions: BlockPosition[],
  selectedPageId: string | null,
  dbEdges: DbEdge[],
  selectedNodeIds: string[] = []
) {
  const [state, dispatch] = useReducer(reducer, initial);

  // Extract component definitions from all blocks
  const componentDefinitionsById = useMemo(() => {
    const allBlocks = Object.values(blockById);
    const definitions = extractComponentDefinitions(allBlocks);
    return definitions.reduce(
      (map, def) => {
        map[def.id] = def;
        return map;
      },
      {} as Record<string, ComponentDefinition>
    );
  }, [blockById]);

  useEffect(() => {
    dispatch({
      type: "SET_FROM_PAGE",
      payload: {
        blockById,
        positions,
        contextPageId: selectedPageId,
        dbEdges,
        selectedNodeIds,
        componentDefinitionsById,
      },
    });
  }, [
    blockById,
    positions,
    selectedPageId,
    dbEdges,
    selectedNodeIds,
    componentDefinitionsById,
  ]);

  return useMemo(
    () => ({
      nodes: state.nodes,
      edges: state.edges,
      componentDefinitionsById,
    }),
    [state, componentDefinitionsById]
  );
}

// Component-aware node definition builder
function buildComponentAwareNodeDefinition(
  block: Block,
  componentDefinitionsById: Record<string, ComponentDefinition>
): { nodeType: string; data: Record<string, unknown> } {
  // Use the standard node building logic first with component definitions
  const { nodeType, data } = buildNodeDefinition(
    block,
    componentDefinitionsById
  );

  // For component instances, resolve style from definition + overrides
  if (isComponentInstance(block)) {
    const resolvedStyle = resolveNodeStyle(block, componentDefinitionsById);

    // Apply resolved style to node data
    const resolvedSize = resolvedStyle.size as any;
    const enhancedData = {
      ...data,
      // Override width/height from resolved style
      width: resolvedSize?.width || (data as any)?.width,
      height: resolvedSize?.height || (data as any)?.height,
      // Add resolved style properties
      ...resolvedStyle,
      // Keep original block reference
      block,
    };

    return { nodeType, data: enhancedData };
  }

  // For component definitions, mark them as such
  if (isComponentDefinition(block)) {
    const enhancedData = {
      ...data,
      __isDefinition: true,
      block,
    };

    return { nodeType, data: enhancedData };
  }

  // For regular blocks, return as-is
  return { nodeType, data };
}

// Get component status for node rendering
function getComponentNodeStatus(
  block: Block,
  componentDefinitionsById: Record<string, ComponentDefinition>
): string | undefined {
  if (isComponentInstance(block)) {
    const definition =
      componentDefinitionsById[block.metadata.component_id as string];

    if (!definition) {
      return "orphaned";
    }

    const hasOverrides =
      block.metadata?.node_ui && Object.keys(block.metadata.node_ui).length > 0;

    return hasOverrides ? "overridden" : "active";
  }

  if (isComponentDefinition(block)) {
    return "definition";
  }

  return undefined;
}
