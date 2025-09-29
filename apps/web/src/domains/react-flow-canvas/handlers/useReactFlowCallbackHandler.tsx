'use client';

import React, { useCallback, useMemo } from 'react';
import type { Node, Edge, OnConnect, Connection } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';
import { useReactFlowSelectionCommands } from '../contexts/ReactFlowSelectionContext';
import { useReactFlowCommandsContext } from '../contexts/ReactFlowCommandsContext';
import { useCanvasData } from '@/domains/canvas/contexts/CanvasDataContext';
import { usePanel } from '../contexts/PanelContext';

export type UseReactFlowHandlerResult = {
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onNodeClick: (evt: React.MouseEvent, node: Node) => void;
  onEdgeClick: (evt: React.MouseEvent, edge: Edge) => void;
  onPaneClick: (event: React.MouseEvent) => void;
  onConnect: OnConnect;
  onNodeDragStart: (event: React.MouseEvent, node: Node) => void;
  onNodeDragStop: (evt: React.MouseEvent, node: Node, nodes: Node[]) => void;
  onNodeDoubleClick: (evt: React.MouseEvent, node: Node) => void;
  onEdgeDoubleClick: (evt: React.MouseEvent, edge: Edge) => void;
  onNodesDelete: (nodes: Node[]) => void;
  onEdgesDelete: (edges: Edge[]) => void;
  onConnectStart: () => void;
  onConnectEnd: () => void;
  onSelectionChange: (params: { nodes: Node[]; edges: Edge[] }) => void;
  onSelectionDragStart: (event: React.MouseEvent) => void;
  onSelectionDrag: (event: React.MouseEvent) => void;
  onSelectionDragStop: (event: React.MouseEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
};

export interface UseReactFlowHandlerOptions {
  focusOnNode?: (nodeId: string) => void;
}

export function useReactFlowHandler(
  options: UseReactFlowHandlerOptions = {}
): UseReactFlowHandlerResult {
  const { focusOnNode } = options;
  const { selectNodes, selectEdges, clearSelection } =
    useReactFlowSelectionCommands();
  const { nodeCommands } = useReactFlowCommandsContext();
  const { selectedPageId } = useCanvasData();
  const rf = useReactFlow();
  const panel = usePanel();

  // 노드 클릭: React Flow 내장 선택 처리 + Canvas 도메인 콜백
  const onNodeClick = useCallback((evt: React.MouseEvent, node: Node) => {
    evt.preventDefault();
    evt.stopPropagation();

    // React Flow가 자동으로 선택 상태를 처리하므로 추가 로직 불필요
    // onSelectionChange에서 SelectionContext와 동기화됨

    // Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
    // domainCallbacks.onNodeClick?.(node, evt);
  }, []);

  // 엣지 클릭: React Flow 내장 선택 처리 + Canvas 도메인 콜백
  const onEdgeClick = useCallback((evt: React.MouseEvent, edge: Edge) => {
    // console.log('🖱️ Edge clicked:', { edgeId: edge.id });
    // React Flow가 자동으로 선택 상태를 처리하므로 추가 로직 불필요
    // onSelectionChange에서 SelectionContext와 동기화됨
    // Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
    // domainCallbacks.onEdgeClick?.(edge, evt);
  }, []);

  // 캔버스 클릭: React Flow 내장 선택 처리 + Canvas 도메인 콜백
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      // console.log('🖱️ Pane clicked - clearing selection');

      // React Flow가 자동으로 선택 해제를 처리하므로 추가 로직 불필요
      // onSelectionChange에서 SelectionContext와 동기화됨

      clearSelection();
      panel.closeEditorPanel();
      panel.closeBlockInsertPanel();
    },
    [clearSelection, panel]
  );

  // 노드 연결: Optimistic UI + Canvas 도메인 콜백
  const onConnect = useCallback<OnConnect>((connection: Connection) => {
    // 1️⃣ Optimistic UI: RF 엣지 즉시 추가
    // if (connection.source && connection.target) {
    //   const newEdge = {
    //     id: `edge-${connection.source}-${connection.target}`,
    //     source: connection.source,
    //     target: connection.target,
    //     type: 'default',
    //   };
    //   // TODO: RF 엣지 추가 로직
    // }
    // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
    // domainCallbacks.onConnect?.(connection);
  }, []);

  // 노드 드래그 시작: React Flow 내장 선택 처리 + Canvas 도메인 콜백
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    // React Flow가 자동으로 선택 상태를 처리하므로 추가 로직 불필요
    // onSelectionChange에서 SelectionContext와 동기화됨
    // Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
    // domainCallbacks.onNodeDragStart?.(node, event);
  }, []);

  // 노드 드래그 종료: DB 업데이트
  const onNodeDragStop = useCallback(
    async (evt: React.MouseEvent, node: Node, nodes: Node[]) => {
      // React Flow Commands의 updateNodePosition 사용 (Optimistic UI + DB 업데이트)
      if (!selectedPageId) return;
      const newPositions = nodes.map(node => ({
        node,
        x: node.position.x,
        y: node.position.y,
      }));
      await nodeCommands.updateNodePositions(selectedPageId, newPositions);
    },
    [nodeCommands, selectedPageId]
  );

  // 노드 더블클릭: Canvas 도메인 콜백 + 포커싱
  const onNodeDoubleClick = useCallback(
    (evt: React.MouseEvent, node: Node) => {
      // Canvas 도메인 콜백 실행 (에디터 패널 열기)
      // domainCallbacks.onNodeDoubleClick?.(node, evt);

      // 노드 포커싱 (에디터 열 때)
      if (focusOnNode) {
        setTimeout(() => {
          focusOnNode(node.id);
          panel.openEditorPanel();
          selectNodes([node.id]);
        }, 100);
      }
    },
    [focusOnNode]
  );

  // 엣지 더블클릭: Canvas 도메인 콜백만 (UI 변경 없음)
  const onEdgeDoubleClick = useCallback((evt: React.MouseEvent, edge: Edge) => {
    // Canvas 도메인 콜백 실행
    // domainCallbacks.onEdgeDoubleClick?.(edge, evt);
  }, []);

  // 노드 삭제: DB 업데이트
  const onNodesDelete = useCallback(
    async (nodes: Node[]) => {
      // React Flow Commands의 deleteBlock 사용 (Optimistic UI + DB 업데이트)
      await nodeCommands.deleteNodes(nodes);
    },
    [nodeCommands]
  );

  // 엣지 삭제: Optimistic UI + Canvas 도메인 콜백
  const onEdgesDelete = useCallback(async (edges: Edge[]) => {
    // const edgeIds = edges.map(edge => edge.id);
    // 1️⃣ Optimistic UI: RF 엣지 즉시 삭제
    // await edgeCommands.deleteEdges(edgeIds);
    // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
    // TODO: Canvas 도메인 삭제 콜백 추가
  }, []);

  // 연결 시작: Canvas 도메인 콜백만
  const onConnectStart = useCallback(() => {}, []);

  // 연결 종료: Canvas 도메인 콜백만
  const onConnectEnd = useCallback(() => {}, []);

  // 선택 변경: React Flow 내장 이벤트를 사용하여 SelectionContext 동기화
  const onSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
      // React Flow의 내장 선택 상태를 SelectionContext와 동기화
      const selectedNodeIds = nodes.map(node => node.id);
      const selectedEdgeIds = edges.map(edge => edge.id);

      // console.log('🔄 React Flow selection changed:', { selectedNodeIds, selectedEdgeIds });

      // SelectionContext 상태 업데이트
      if (selectedNodeIds.length > 0) {
        selectNodes(selectedNodeIds);
      } else {
        clearSelection();
      }
      if (selectedEdgeIds.length > 0) {
        // TODO: 엣지 선택 처리
        selectEdges(selectedEdgeIds);
      }
    },
    [selectNodes, selectEdges, clearSelection]
  );

  // 드래그 선택 시작: React Flow 내장 이벤트
  const onSelectionDragStart = useCallback((event: React.MouseEvent) => {
    // console.log('🎯 Selection drag started');
    // React Flow가 자동으로 처리하므로 추가 로직 불필요
  }, []);

  // 드래그 선택 중: React Flow 내장 이벤트
  const onSelectionDrag = useCallback((event: React.MouseEvent) => {
    // React Flow가 자동으로 처리하므로 추가 로직 불필요
  }, []);

  // 드래그 선택 종료: React Flow 내장 이벤트
  const onSelectionDragStop = useCallback((event: React.MouseEvent) => {
    // console.log('✅ Selection drag stopped');
    // React Flow가 자동으로 처리하므로 추가 로직 불필요
  }, []);

  // 드롭 핸들러: block-insert-panel에서 드래그된 블록을 캔버스에 생성
  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const blockKind = event.dataTransfer.getData('application/x-canvas-kind');
      if (!blockKind || !selectedPageId) return;

      // 드롭 위치 계산 (캔버스 좌표계로 변환)
      const position = rf.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // console.log('🎯 Block dropped:', { blockKind, position });

      // 블록 생성
      const result = await nodeCommands.createNode(
        selectedPageId,
        blockKind,
        position
      );

      if (result.ok && result.data?.blockId) {
        const blockId = result.data.blockId;

        // handleFocusAndEdit과 동일한 로직:
        // 1. 노드 선택 (이미 createBlockInPage에서 처리됨)
        // 2. 에디터 패널 열기
        // 3. Insert 패널 닫기
        // 4. 포커스 및 뷰포트 이동

        // 에디터 패널 열기

        // Insert 패널 닫기

        // 포커스 및 뷰포트 이동
        panel.closeBlockInsertPanel();
        setTimeout(() => {
          if (focusOnNode) {
            focusOnNode(blockId);
            panel.openEditorPanel();
          }
        }, 100);
      }
    },
    [selectedPageId, nodeCommands, focusOnNode]
  );

  // 드래그 오버 핸들러: 드롭을 허용하도록 설정
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 노드 변경: React Flow 내부 처리 (ReactFlowCanvasCommands에서 처리)
  const onNodesChange = useCallback((changes: any[]) => {
    // React Flow 내부 상태만 업데이트 (Canvas 도메인 동기화는 별도 이벤트로 처리)
    // console.log('Nodes changed (internal):', changes);
  }, []);

  // 엣지 변경: React Flow 내부 처리 (ReactFlowCanvasCommands에서 처리)
  const onEdgesChange = useCallback((changes: any[]) => {
    // React Flow 내부 상태만 업데이트 (Canvas 도메인 동기화는 별도 이벤트로 처리)
    // console.log('Edges changed (internal):', changes);
  }, []);

  const result: UseReactFlowHandlerResult = useMemo(
    () => ({
      onNodesChange,
      onEdgesChange,
      onNodeClick,
      onEdgeClick,
      onPaneClick,
      onConnect,
      onNodeDragStart,
      onNodeDragStop,
      onNodeDoubleClick,
      onEdgeDoubleClick,
      onNodesDelete,
      onEdgesDelete,
      onConnectStart,
      onConnectEnd,
      onSelectionChange,
      onSelectionDragStart,
      onSelectionDrag,
      onSelectionDragStop,
      onDrop,
      onDragOver,
    }),
    [
      onNodesChange,
      onEdgesChange,
      onNodeClick,
      onEdgeClick,
      onPaneClick,
      onConnect,
      onNodeDragStart,
      onNodeDragStop,
      onNodeDoubleClick,
      onEdgeDoubleClick,
      onNodesDelete,
      onEdgesDelete,
      onConnectStart,
      onConnectEnd,
      onSelectionChange,
      onSelectionDragStart,
      onSelectionDrag,
      onSelectionDragStop,
      onDrop,
      onDragOver,
    ]
  );

  return result;
}
