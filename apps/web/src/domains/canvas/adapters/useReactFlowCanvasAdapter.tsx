"use client";

import { useCallback, useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Block, BlockPosition, Edge as DbEdge } from "@/db/schema";
import type { ReactFlowCanvasEvents } from "@/domains/react-flow-canvas/types/react-flow-types";
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
  
  // 선택 상태 (에디터/다른 컴포넌트에서 사용)
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  
  // UI 상태
  canvasMode: "page" | "component";
  showEditorPanel: boolean;
  showBlockInsertPanel: boolean;
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
  
  // 선택 관리 (에디터/다른 컴포넌트에서 사용)
  setNodeSelection: (nodeIds: string[]) => void;
  selectEdge: (edgeId: string | null) => void;
  
  // UI 관리
  openBlockInsertPanel: () => void;
  closeBlockInsertPanel: () => void;
  openEditorPanel: () => void;
  closeEditorPanel: () => void;
  togglePageEditor: () => void;
  toggleEditor: (blockId: string) => void;
  selectComponent: (componentId: string | null) => void;
}

// Canvas 도메인 UI 렌더링 설정 인터페이스
export interface CanvasDomainUIRenderers {
  // 툴바 렌더링 플래그들
  renderCanvasToolbar?: boolean;
  renderComponentToolbar?: boolean;
  renderViewToolbar?: boolean;
  
  // Canvas 툴바 콜백들
  isAddOpen?: boolean;
  toggleAdd?: () => void;
  isEditOpen?: boolean;
  toggleEdit?: () => void;
  isPageSelected?: boolean;
  isPageEditorOpen?: boolean;
  
  // Component 툴바 콜백들
  onBackToPage?: () => void;
  componentName?: string | null;
  
  // Context 메뉴
  renderContextMenu?: (menuState: { id: string; x: number; y: number } | null) => React.ReactNode;
}

// 블록을 React Flow 노드로 변환하는 함수 타입
export type BlockToNodeTransformer = (
  blocksById: Record<string, Block>,
  positions: BlockPosition[],
  contextId: string | null,
  edges: DbEdge[],
  selectedNodeIds: string[]
) => { nodes: Node[]; edges: Edge[] };

// Canvas 도메인 어댑터 옵션
export interface UseReactFlowCanvasAdapterOptions {
  // Canvas 도메인 상태
  domainState: CanvasDomainState;
  
  // Canvas 도메인 명령
  domainCommands: CanvasDomainCommands;
  
  // UI 렌더링 콜백들
  uiRenderers: CanvasDomainUIRenderers;
}

// React Flow Canvas 상태 (어댑터 출력)
export interface ReactFlowCanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
}


// 어댑터 결과
export interface UseReactFlowCanvasAdapterResult {
  reactFlowState: ReactFlowCanvasState;
  reactFlowEvents: ReactFlowCanvasEvents;
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
    uiRenderers,
  } = options;

  // 블록 → React Flow 노드 변환 함수
  const blockToNodeTransformer: BlockToNodeTransformer = (
    blocksById: Record<string, Block>,
    positions: BlockPosition[],
    contextId: string | null,
    edges: DbEdge[],
    selectedNodeIds: string[]
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

        // Add component-specific metadata and selection state to node data
        const enhancedData = {
          ...data,
          __isComponentInstance: isComponentInstance(block),
          __isComponentDefinition: isComponentDefinition(block),
          __componentStatus: getComponentNodeStatus(
            block,
            componentDefinitionsById
          ),
          // 선택 상태를 data에 포함 (NodeChrome에서 사용)
          selected: selectedNodeIds.includes(block.id as string),
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
      domainState.edgesArray,
      domainState.selectedNodeIds
    );

    return {
      nodes,
      edges,
      selectedNodeIds: domainState.selectedNodeIds,
      selectedEdgeIds: domainState.selectedEdgeIds,
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
  const onNodeClick = useCallback((node: Node, event: React.MouseEvent) => {
    // Ctrl/Cmd 키 확인 (Mac에서는 metaKey, 다른 OS에서는 ctrlKey)
    const isMultiSelect = event.metaKey || event.ctrlKey;
    
    let newSelectedIds: string[];
    
    if (isMultiSelect) {
      // Ctrl/Cmd 키가 눌려있으면 다중 선택 처리
      if (domainState.selectedNodeIds.includes(node.id)) {
        // 이미 선택된 노드면 선택 해제
        newSelectedIds = domainState.selectedNodeIds.filter(id => id !== node.id);
      } else {
        // 선택되지 않은 노드면 추가
        newSelectedIds = [...domainState.selectedNodeIds, node.id];
      }
    } else {
      // Ctrl/Cmd 키가 눌려있지 않으면 단일 선택
      newSelectedIds = [node.id];
    }
    
    domainCommands.setNodeSelection(newSelectedIds);
  }, [domainCommands.setNodeSelection, domainState.selectedNodeIds]);

  const onNodeDoubleClick = useCallback((node: Node, event: React.MouseEvent) => {
    domainCommands.toggleEditor(node.id);
    // 포커싱은 useReactFlowCanvasControl에서 처리됨
  }, [domainCommands.toggleEditor]);

  const onNodeDragStart = useCallback((node: Node, event: React.MouseEvent) => {
    if (!domainState.selectedNodeIds.includes(node.id)) {
      domainCommands.setNodeSelection([node.id]);
    }
  }, [domainCommands.setNodeSelection, domainState.selectedNodeIds]);

  const onNodeDragStop = useCallback(async (node: Node, event: React.MouseEvent) => {
    await domainCommands.updateNodePosition(node.id, node.position);
  }, [domainCommands.updateNodePosition]);

  const onEdgeClick = useCallback((edge: Edge, event: React.MouseEvent) => {
    domainCommands.selectEdge(edge.id || null);
  }, [domainCommands.selectEdge]);

  const onEdgeDoubleClick = useCallback((edge: Edge, event: React.MouseEvent) => {
    // TODO: 엣지 편집 구현
    console.log('Edit edge:', edge.id);
  }, []);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    // 선택 해제
    domainCommands.setNodeSelection([]);
    domainCommands.selectEdge(null);
    
    // 에디터 패널이 열려있으면 닫기
    if (domainState.showEditorPanel) {
      domainCommands.closeEditorPanel();
    }
  }, [domainCommands.setNodeSelection, domainCommands.selectEdge, domainCommands.closeEditorPanel, domainState.showEditorPanel]);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    // TODO: 컨텍스트 메뉴 구현
  }, []);

  const onSelectionChange = useCallback((selectedNodes: Node[], selectedEdges: Edge[]) => {
    const nodeIds = selectedNodes.map(node => node.id);
    const edgeIds = selectedEdges.map(edge => edge.id);
    
    domainCommands.setNodeSelection(nodeIds);
    if (edgeIds.length > 0) {
      domainCommands.selectEdge(edgeIds[0] || null);
    } else {
      domainCommands.selectEdge(null);
    }
  }, [domainCommands.setNodeSelection, domainCommands.selectEdge]);

  const onDragSelectionStart = useCallback((startPos: { x: number; y: number }) => {
    console.log('Drag selection start:', startPos);
  }, []);

  const onDragSelectionUpdate = useCallback((currentPos: { x: number; y: number }) => {
    console.log('Drag selection update:', currentPos);
  }, []);

  const onDragSelectionEnd = useCallback((selectedNodeIds: string[]) => {
    if (selectedNodeIds.length > 0) {
      domainCommands.setNodeSelection(selectedNodeIds);
    }
  }, [domainCommands.setNodeSelection]);

  const onConnect = useCallback((connection: any) => {
    // TODO: 엣지 연결 구현
    console.log('Connect:', connection);
  }, []);

  const onConnectStart = useCallback((event: React.MouseEvent) => {
    // TODO: 연결 시작 처리
    console.log('Connect start');
  }, []);

  const onConnectEnd = useCallback((event: React.MouseEvent) => {
    // TODO: 연결 종료 처리
    console.log('Connect end');
  }, []);

  const onMove = useCallback((event: any, viewport: any) => {
    // TODO: 뷰포트 이동 처리
    console.log('Move:', viewport);
  }, []);

  const onMoveStart = useCallback((event: any, viewport: any) => {
    // TODO: 뷰포트 이동 시작 처리
    console.log('Move start');
  }, []);

  const onMoveEnd = useCallback((event: any, viewport: any) => {
    // TODO: 뷰포트 이동 종료 처리
    console.log('Move end');
  }, []);

  const onZoom = useCallback((event: any, viewport: any) => {
    // TODO: 줌 처리
    console.log('Zoom:', viewport);
  }, []);

  const onZoomStart = useCallback((event: any, viewport: any) => {
    // TODO: 줌 시작 처리
    console.log('Zoom start');
  }, []);

  const onZoomEnd = useCallback((event: any, viewport: any) => {
    // TODO: 줌 종료 처리
    console.log('Zoom end');
  }, []);

  const onNodeDimensionsChange = useCallback((changes: any[]) => {
    const sizeUpdates: { id: string; width: number; height: number }[] = [];
    for (const ch of changes || []) {
      if (ch?.type !== "dimensions" || !ch?.dimensions) continue;
      const w = (ch as any).dimensions?.width;
      const h = (ch as any).dimensions?.height;
      const resizing = (ch as any).resizing as boolean | undefined;
      if (resizing !== false) continue; // persist at end of resize
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
    const posUpdates: { id: string; x: number; y: number }[] = [];
    for (const ch of changes || []) {
      if (ch?.type === "position") {
        const dragging = (ch as any).dragging as boolean | undefined;
        // 드래그 중이거나 드래그 종료 시에는 처리하지 않음 (onNodeDragStop에서 처리)
        if (dragging !== undefined) continue;

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

  // 툴바 렌더링 플래그들 - 직접 전달
  const renderCanvasToolbar = uiRenderers.renderCanvasToolbar;
  const renderComponentToolbar = uiRenderers.renderComponentToolbar;
  const renderViewToolbar = uiRenderers.renderViewToolbar;
  const renderContextMenu = uiRenderers.renderContextMenu;

  // 키보드 이벤트 핸들러들
  const onEscape = useCallback(() => {
    // 에디터 패널이 열려있으면 닫기
    if (domainState.showEditorPanel) {
      domainCommands.closeEditorPanel();
    } else {
      // 에디터가 닫혀있으면 선택 해제
      domainCommands.setNodeSelection([]);
      domainCommands.selectEdge(null);
    }
  }, [domainState.showEditorPanel, domainCommands.closeEditorPanel, domainCommands.setNodeSelection, domainCommands.selectEdge]);

  const onClearSelection = useCallback(() => {
    domainCommands.setNodeSelection([]);
    domainCommands.selectEdge(null);
  }, [domainCommands.setNodeSelection, domainCommands.selectEdge]);

  // 이벤트 객체 조합
  const reactFlowEvents = useMemo((): ReactFlowCanvasEvents => {
    return {
      // 이벤트 핸들러들
      onNodeClick,
      onNodeDoubleClick,
      onNodeDragStart,
      onNodeDragStop,
      onEdgeClick,
      onEdgeDoubleClick,
      onPaneClick,
      onPaneContextMenu,
      onSelectionChange,
      onDragSelectionStart,
      onDragSelectionUpdate,
      onDragSelectionEnd,
      onConnect,
      onConnectStart,
      onConnectEnd,
      onMove,
      onMoveStart,
      onMoveEnd,
      onZoom,
      onZoomStart,
      onZoomEnd,
      onNodeDimensionsChange,
      onNodeDataChange,
      onNodePositionChange,
      onEscape,
      onClearSelection,
      
      // 툴바 렌더링 플래그들
      renderCanvasToolbar,
      renderComponentToolbar,
      renderViewToolbar,
      
      // Canvas 툴바 콜백들
      isAddOpen: uiRenderers.isAddOpen,
      toggleAdd: uiRenderers.toggleAdd,
      isEditOpen: uiRenderers.isEditOpen,
      toggleEdit: uiRenderers.toggleEdit,
      isPageSelected: uiRenderers.isPageSelected,
      isPageEditorOpen: uiRenderers.isPageEditorOpen,
      
      // Component 툴바 콜백들
      onBackToPage: uiRenderers.onBackToPage,
      componentName: uiRenderers.componentName,
      
      // Context 메뉴
      renderContextMenu,
    };
  }, [
    onNodeClick,
    onNodeDoubleClick,
    onNodeDragStart,
    onNodeDragStop,
    onEdgeClick,
    onEdgeDoubleClick,
    onPaneClick,
    onPaneContextMenu,
    onSelectionChange,
    onDragSelectionStart,
    onDragSelectionUpdate,
    onDragSelectionEnd,
    onConnect,
    onConnectStart,
    onConnectEnd,
    onMove,
    onMoveStart,
    onMoveEnd,
    onZoom,
    onZoomStart,
    onZoomEnd,
    onNodeDimensionsChange,
    onNodeDataChange,
    onNodePositionChange,
    onEscape,
    onClearSelection,
    renderCanvasToolbar,
    renderComponentToolbar,
    renderViewToolbar,
    renderContextMenu,
    uiRenderers,
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
