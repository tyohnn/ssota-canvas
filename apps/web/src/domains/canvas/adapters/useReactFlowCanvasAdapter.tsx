"use client";

import { useCallback, useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Block, BlockPosition, Edge as DbEdge } from "@/db/schema";
import type { CanvasDomainCallbacks } from "@/domains/react-flow-canvas/types/react-flow-types";
import { buildNodeDefinition } from "@/domains/canvas/policy/block-rendering-policy";
import {
  isComponentInstance,
  isComponentDefinition,
  resolveNodeStyle,
  extractComponentDefinitions,
  type ComponentDefinition,
} from "@/domains/canvas/types/component";

// Canvas 도메인 상태 인터페이스
export interface CanvasDomainState {
  // 데이터 상태
  blocksById: Record<string, Block>;
  positionsArray: BlockPosition[];
  edgesArray: DbEdge[];
  contextId: string | null;
  // Canvas 모드
  canvasMode: "page" | "component";
}

// Canvas 도메인 명령 인터페이스
export interface CanvasDomainCommands {
  // 블록 관리
  createBlockInPage: (pageId: string, kind: string, position: { x: number; y: number }) => Promise<{ ok: boolean; error?: string }>;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => Promise<{ ok: boolean; error?: string }>;
  updateNodePositions: (updates: { id: string; x: number; y: number }[]) => Promise<{ ok: boolean; error?: string }>;
  updateNodeSize: (nodeId: string, size: { width: number; height: number }) => Promise<{ ok: boolean; error?: string }>;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  deleteBlock: (blockId: string) => Promise<{ ok: boolean; error?: string }>;
  
  // 컴포넌트 선택
  selectComponent: (componentId: string | null) => void;
}

// 블록을 React Flow 노드로 변환하는 함수 타입
export type BlockToNodeTransformer = (
  blocksById: Record<string, Block>,
  positions: BlockPosition[],
  contextId: string | null,
  edges: DbEdge[]
) => { nodes: Node[]; edges: Edge[] };

// Canvas 도메인 어댑터 옵션
export interface UseReactFlowCanvasAdapterOptions {
  // Canvas 도메인 상태
  domainState: CanvasDomainState;
  
  // Canvas 도메인 명령
  domainCommands: CanvasDomainCommands;
}

// React Flow Canvas 상태 (어댑터 출력)
export interface ReactFlowCanvasState {
  nodes: Node[];
  edges: Edge[];
}


// 어댑터 결과
export interface UseReactFlowCanvasAdapterResult {
  reactFlowState: ReactFlowCanvasState;
  reactFlowEvents: CanvasDomainCallbacks;
}

/**
 * Canvas 도메인을 React Flow Canvas와 연결하는 어댑터
 */
export function useReactFlowCanvasAdapter(
  options: UseReactFlowCanvasAdapterOptions
): UseReactFlowCanvasAdapterResult {
  const {
    domainState,
    domainCommands,
  } = options;

  // 블록 → React Flow 노드 변환 함수
  const blockToNodeTransformer: BlockToNodeTransformer = (
    blocksById: Record<string, Block>,
    positions: BlockPosition[],
    contextId: string | null,
    edges: DbEdge[]
  ) => {
    if (!contextId) return { nodes: [], edges: [] };

    // Extract component definitions from all blocks
    const allBlocks = Object.values(blocksById);
    const definitions = extractComponentDefinitions(allBlocks);
    const componentDefinitionsById = definitions.reduce(
      (map, def) => {
        map[def.id] = def;
        return map;
      },
      {} as Record<string, ComponentDefinition>
    );

    // Filter positions for current context
    const filtered = positions.filter(
      (p) => (p.context_block_id as string) === contextId
    );

    // Build nodes
    const nodes: Node[] = filtered
      .map((p) => {
        const block = blocksById[p.block_id as string];
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
        } as Node;
      })
      .filter(Boolean) as Node[];

    // Build edges
    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const rfEdges: Edge[] = (edges || [])
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
  };

  // ============================================================================
  // 1. React Flow Canvas 상태 변환
  // ============================================================================
  const reactFlowState = useMemo((): ReactFlowCanvasState => {
    // 블록을 React Flow 노드로 변환
    const { nodes, edges } = blockToNodeTransformer(
      domainState.blocksById,
      domainState.positionsArray,
      domainState.contextId,
      domainState.edgesArray
    );

    return {
      nodes,
      edges,
    };
  }, [
    domainState.blocksById,
    domainState.positionsArray,
    domainState.contextId,
    domainState.edgesArray,
  ]);

  // ============================================================================
  // 2. React Flow Canvas 이벤트 콜백들 (Canvas 도메인 명령을 콜백으로 전달)
  // ============================================================================
  
  // 개별 이벤트 콜백들을 useCallback으로 정의
  const onConnect = useCallback((connection: any) => {
    // TODO: 엣지 연결 구현 - Phase 2에서 완성 예정
    console.log('Connect:', connection);
    // domainCommands.createEdge?.(connection.source, connection.target, connection.type);
  }, []);

  const onConnectStart = useCallback((event: React.MouseEvent) => {
    // TODO: 연결 시작 처리
    console.log('Connect start');
  }, []);

  const onConnectEnd = useCallback((event: React.MouseEvent) => {
    // TODO: 연결 종료 처리
    console.log('Connect end');
  }, []);

  const onNodeDimensionsChange = useCallback((changes: any[]) => {
    // React Flow 내부에서 상태를 관리하므로 모든 크기 변경을 DB에 저장
    const sizeUpdates: { id: string; width: number; height: number }[] = [];
    for (const ch of changes || []) {
      if (ch?.type !== "dimensions" || !ch?.dimensions) continue;
      const w = (ch as any).dimensions?.width;
      const h = (ch as any).dimensions?.height;
      if (typeof w === "number" && typeof h === "number") {
        sizeUpdates.push({
          id: ch.id,
          width: Math.round(w),
          height: Math.round(h),
        });
      }
    }
    if (sizeUpdates.length > 0) {
      sizeUpdates.forEach(({ id, width, height }) => {
        domainCommands.updateNodeSize?.(id, { width, height });
      });
    }
  }, [domainCommands.updateNodeSize]);

  const onNodeDataChange = useCallback((changes: any[]) => {
    const dataUpdates: { id: string; data: Record<string, unknown> }[] = [];
    for (const ch of changes || []) {
      if (ch?.type === "data" && ch?.data) {
        dataUpdates.push({ id: ch.id, data: ch.data });
      } else if (ch?.type === "replace" && (ch as any).item?.data) {
        dataUpdates.push({ id: ch.id, data: (ch as any).item.data });
      }
    }
    if (dataUpdates.length > 0) {
      dataUpdates.forEach(({ id, data: d }) => {
        domainCommands.updateNodeData?.(id, d);
      });
    }
  }, [domainCommands.updateNodeData]);

  const onNodePositionChange = useCallback((changes: any[]) => {
    // React Flow 내부에서 상태를 관리하므로 모든 위치 변경을 DB에 저장
    const posUpdates: { id: string; x: number; y: number }[] = [];
    for (const ch of changes || []) {
      if (ch?.type === "position") {
        const pos = (ch as any).position as { x?: number; y?: number } | undefined;
        if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
          if (Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
            posUpdates.push({ id: ch.id, x: pos.x, y: pos.y });
          }
        }
      }
    }
    if (posUpdates.length > 0) {
      posUpdates.forEach(({ id, x, y }) => {
        domainCommands.updateNodePosition?.(id, { x, y });
      });
    }
  }, [domainCommands.updateNodePosition]);

  // 이벤트 객체 조합
  const reactFlowEvents = useMemo((): CanvasDomainCallbacks => {
    return {
      // 이벤트 핸들러들
      onConnect,
      onConnectStart,
      onConnectEnd,
      onNodeDimensionsChange,
      onNodeDataChange,
      onNodePositionChange,
    };
  }, [
    onConnect,
    onConnectStart,
    onConnectEnd,
    onNodeDimensionsChange,
    onNodeDataChange,
    onNodePositionChange,
  ]);

  return {
    reactFlowState,
    reactFlowEvents,
  };
}



// Component-aware node definition builder (useReactFlowViewModel에서 이주)
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

// Get component status for node rendering (useReactFlowViewModel에서 이주)
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
