"use client";

import React from "react";
import { ReactFlowCanvasProvider } from "@/domains/react-flow-canvas";
import { ReactFlowCanvasRenderer } from "@/domains/react-flow-canvas/components/react-flow-renderer";
import type { ReactFlowCanvasConfig } from "@/domains/react-flow-canvas";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import { usePagePositionCache } from "@/domains/canvas/hooks/usePagePositionCache";
import { useReactFlowCanvasAdapter } from "@/domains/canvas/adapters/useReactFlowCanvasAdapter";

/**
 * Canvas 도메인에서 React Flow Canvas를 사용하는 통합 컴포넌트
 */
export function IntegratedReactFlowCanvas() {
  // ============================================================================
  // 1. Canvas 도메인 상태 수집
  // ============================================================================
  const { blocksById } = useCanvasData();
  const sel = useCanvasSelection();
  const commands = useCanvasCommandsContext();
  
  // 페이지 위치 캐싱
  const { getPageData, loadPageData } = usePagePositionCache();
  
  // 컨텍스트 ID 계산
  const { canvasMode } = sel;
  const contextId = React.useMemo(
    () => (canvasMode === "component" ? sel.componentId : sel.pageId) || null,
    [canvasMode, sel.pageId, sel.componentId]
  );
  
  // 캐시된 데이터 가져오기
  const { positionsArray, edgesArray } = React.useMemo(() => {
    if (!contextId) {
      return { positionsArray: [], edgesArray: [] };
    }

    const cachedData = getPageData(contextId);
    if (cachedData) {
      return {
        positionsArray: cachedData.positions,
        edgesArray: cachedData.edges,
      };
    }

    return { positionsArray: [], edgesArray: [] };
  }, [contextId, getPageData]);
  
  // 데이터 로딩
  const lastLoadedContextRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!contextId) return;
    if (getPageData(contextId)) return; // cache hit
    if (lastLoadedContextRef.current === contextId) return; // already requested
    lastLoadedContextRef.current = contextId;
    loadPageData(contextId).catch(() => {});
  }, [contextId, getPageData, loadPageData]);
  
  // ============================================================================
  // 2. Canvas 도메인 어댑터 설정
  // ============================================================================
  // 도메인 상태 어댑터
  const domainState = React.useMemo(() => ({
    blocksById,
    positionsArray,
    edgesArray,
    contextId,
    canvasMode,
  }), [
    blocksById,
    positionsArray,
    edgesArray,
    contextId,
    canvasMode,
  ]);
  
  // 도메인 명령 어댑터
  const domainCommands = React.useMemo(() => ({
    // 블록 관리
    createBlockInPage: commands.createBlockInPage,
    updateNodePosition: commands.updateNodePosition,
    updateNodePositions: commands.updateNodePositions,
    updateNodeSize: async (nodeId: string, size: { width: number; height: number }) => {
      // TODO: 블록 크기 업데이트 구현
      console.log('Update node size:', nodeId, size);
      return { ok: true };
    },
    updateNodeData: async (nodeId: string, data: Record<string, unknown>) => {
      // TODO: 블록 데이터 업데이트 구현
      console.log('Update node data:', nodeId, data);
      return { ok: true };
    },
    deleteBlock: commands.deleteBlock,
    selectComponent: sel.selectComponent,
  }), [
    commands,
    sel,
  ]);
  
  // Canvas 도메인 어댑터 사용
  const { reactFlowState, reactFlowEvents } = useReactFlowCanvasAdapter({
    domainState,
    domainCommands,
  });


  
  // ============================================================================
  // 3. React Flow Canvas 설정
  // ============================================================================
  const config: ReactFlowCanvasConfig = React.useMemo(() => ({
    minZoom: 0.1,
    maxZoom: 2,
    fitView: true,
    nodesDraggable: true,
    elementsSelectable: true,
    selectionOnDrag: false,
    panOnDrag: [1, 2],
    enableMultiSelection: true,
    enableDragSelection: true,
    showControls: true,
    showMiniMap: true,
    showBackground: true,
  }), []);
  
  // ============================================================================
  // 4. 렌더링
  // ============================================================================
  return (
    <div className="h-full w-full">
      <ReactFlowCanvasProvider 
        config={config}
        domainCallbacks={reactFlowEvents}
        initialNodes={reactFlowState.nodes}
        initialEdges={reactFlowState.edges}
      >
        <ReactFlowCanvasRenderer />
      </ReactFlowCanvasProvider>
    </div>
  );
}
