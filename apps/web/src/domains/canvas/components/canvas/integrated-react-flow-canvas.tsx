'use client';

import React, { useEffect, useState } from 'react';
import type { BlockPosition, Edge } from '@/db/schema';
import type { BlockWithPosition } from '@/domains/canvas/actions/block-position.action';
import { ReactFlowCanvasRenderer } from '@/domains/react-flow-canvas/components/react-flow-renderer';
import type { ReactFlowCanvasConfig } from '@/domains/react-flow-canvas/contexts/ReactFlowCanvasContext';
import { useCanvasData } from '@/domains/canvas/contexts/CanvasDataContext';
import { useCanvasPageCommandsContext } from '@/domains/canvas/contexts/CanvasPageCommandsContext';
import {
  useReactFlowCanvasAdapter,
  type ReactFlowCanvasState,
} from '@/domains/canvas/adapters/useReactFlowCanvasAdapter';

/**
 * Canvas 도메인에서 React Flow Canvas를 사용하는 통합 컴포넌트
 */
export function IntegratedReactFlowCanvas() {
  // ============================================================================
  // 1. Canvas 도메인 상태 수집
  // ============================================================================
  const canvasData = useCanvasData();
  const pageCommands = useCanvasPageCommandsContext();

  // 현재 페이지의 blocksWithPositions와 edges를 로컬 상태로 관리
  const [currentBlocksWithPositions, setCurrentBlocksWithPositions] = useState<
    BlockWithPosition[]
  >([]);
  const [currentEdges, setCurrentEdges] = useState<Edge[]>([]);

  // 현재 선택된 컨텍스트 ID 계산
  const contextId = React.useMemo(() => {
    if (canvasData.canvasMode === 'component') {
      return canvasData.selectedComponentId;
    }
    return canvasData.selectedPageId;
  }, [
    canvasData.canvasMode,
    canvasData.selectedPageId,
    canvasData.selectedComponentId,
  ]);

  // 페이지가 바뀔 때마다 데이터 로딩
  useEffect(() => {
    if (
      contextId &&
      (canvasData.canvasMode === 'page' ||
        canvasData.canvasMode === 'component')
    ) {
      pageCommands
        .loadPageData(contextId)
        .then(result => {
          if (result.ok && result.data) {
            setCurrentBlocksWithPositions(result.data.blocksWithPositions);
            setCurrentEdges([]); // edges는 별도로 로드해야 함
          }
        })
        .catch(console.error);
    } else {
      // 페이지나 컴포넌트가 선택되지 않은 경우 초기화
      setCurrentBlocksWithPositions([]);
      setCurrentEdges([]);
    }
  }, [contextId, canvasData.canvasMode, pageCommands]);

  // Canvas 도메인 어댑터 사용 (데이터 변환)
  const { getReactFlowState } = useReactFlowCanvasAdapter();
  const [reactFlowState, setReactFlowState] = useState<ReactFlowCanvasState>({
    nodes: [],
    edges: [],
  });

  // 데이터가 변경될 때마다 React Flow 상태 업데이트
  useEffect(() => {
    const newState = getReactFlowState(
      currentBlocksWithPositions,
      currentEdges,
      canvasData
    );
    setReactFlowState(newState);
  }, [getReactFlowState, currentBlocksWithPositions, currentEdges, canvasData]);

  // ============================================================================
  // 3. React Flow Canvas 설정
  // ============================================================================
  const config: ReactFlowCanvasConfig = React.useMemo(
    () => ({
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
    }),
    []
  );

  // ============================================================================
  // 4. 렌더링
  // ============================================================================
  return (
    <div className="h-full w-full">
      <ReactFlowCanvasRenderer
        config={config}
        defaultNodes={reactFlowState.nodes}
        defaultEdges={reactFlowState.edges}
      />
    </div>
  );
}
