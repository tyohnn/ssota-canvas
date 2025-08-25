"use client";

import React, { useCallback, useMemo } from "react";
import type {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  OnConnect,
  Connection,
} from "@xyflow/react";
import { useReactFlowCanvas } from "../contexts/ReactFlowCanvasContext";
import { useSelectionCommands, useSelectionState } from "../contexts/SelectionContext";

export type UseReactFlowHandlerResult = {
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onNodeClick: (evt: React.MouseEvent, node: ReactFlowNode) => void;
  onEdgeClick: (evt: React.MouseEvent, edge: ReactFlowEdge) => void;
  onPaneClick: () => void;
  onConnect: OnConnect;
  onNodeDragStart: (event: React.MouseEvent, node: ReactFlowNode) => void;
  onNodeDragStop: (evt: React.MouseEvent, node: ReactFlowNode) => void;
  onNodeDoubleClick: (evt: React.MouseEvent, node: ReactFlowNode) => void;
  onEdgeDoubleClick: (evt: React.MouseEvent, edge: ReactFlowEdge) => void;
  onNodesDelete: (nodes: ReactFlowNode[]) => void;
  onEdgesDelete: (edges: ReactFlowEdge[]) => void;
  onConnectStart: () => void;
  onConnectEnd: () => void;
  onSelectionChange: (params: { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] }) => void;
};

export interface UseReactFlowHandlerOptions {
  focusOnNode?: (nodeId: string) => void;
}

export function useReactFlowHandler(options: UseReactFlowHandlerOptions = {}): UseReactFlowHandlerResult {
  const { commands, events } = useReactFlowCanvas();
  const { selectNodes, selectEdges, clearSelection } = useSelectionCommands();
  const { selectedNodeIds } = useSelectionState();
  const { focusOnNode } = options;
  
  // 노드 클릭: Optimistic UI + Canvas 도메인 콜백
  const onNodeClick = useCallback(
    (evt: React.MouseEvent, node: ReactFlowNode) => {
      evt.preventDefault();
      evt.stopPropagation();
      
      // Ctrl/Cmd 키 확인 (Mac에서는 metaKey, 다른 OS에서는 ctrlKey)
      const isMultiSelect = evt.metaKey || evt.ctrlKey;
      
      let newSelectedIds: string[];
      
      if (isMultiSelect) {
              // Ctrl/Cmd 키가 눌려있으면 다중 선택 처리
      if (selectedNodeIds.includes(node.id)) {
        // 이미 선택된 노드면 선택 해제
        newSelectedIds = selectedNodeIds.filter(id => id !== node.id);
      } else {
        // 선택되지 않은 노드면 추가
        newSelectedIds = [...selectedNodeIds, node.id];
      }
      } else {
        // Ctrl/Cmd 키가 눌려있지 않으면 단일 선택
        newSelectedIds = [node.id];
      }
      
      // 1️⃣ Optimistic UI: RF 노드 선택 상태 즉시 업데이트
      selectNodes(newSelectedIds);
      
      // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
      events.onNodeClick?.(node, evt);
    },
    [events, selectNodes, selectedNodeIds, focusOnNode]
  );

  // 엣지 클릭: Optimistic UI + Canvas 도메인 콜백
  const onEdgeClick = useCallback(
    (evt: React.MouseEvent, edge: ReactFlowEdge) => {
      // 1️⃣ Optimistic UI: RF 엣지 선택 상태 즉시 업데이트
      selectEdges([edge.id]);
      
      // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
      events.onEdgeClick?.(edge, evt);
    },
    [events, selectEdges]
  );

  // 캔버스 클릭: Optimistic UI + Canvas 도메인 콜백
  const onPaneClick = useCallback(() => {
    // 1️⃣ Optimistic UI: RF 선택 상태 즉시 해제
    clearSelection();
    
    // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
    events.onPaneClick?.(new MouseEvent('click') as any);
  }, [events, clearSelection]);

  // 노드 연결: Optimistic UI + Canvas 도메인 콜백
  const onConnect = useCallback<OnConnect>((connection: Connection) => {
    // 1️⃣ Optimistic UI: RF 엣지 즉시 추가
    if (connection.source && connection.target) {
      const newEdge = {
        id: `edge-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: 'default',
      };
      // TODO: RF 엣지 추가 로직
    }
    
    // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
    events.onConnect?.(connection);
  }, [events]);

  // 노드 드래그 시작: Optimistic UI + Canvas 도메인 콜백
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
    // 1️⃣ Optimistic UI: RF 노드 선택 상태 즉시 업데이트
    if (!selectedNodeIds.includes(node.id)) {
      selectNodes([node.id]);
    }
    
    // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
    events.onNodeDragStart?.(node, event);
      }, [events, commands, selectedNodeIds]);

  // 노드 드래그 종료: Optimistic UI + Canvas 도메인 콜백
  const onNodeDragStop = useCallback(
    async (evt: React.MouseEvent, node: ReactFlowNode) => {
      // 1️⃣ Optimistic UI: RF 노드 위치 즉시 업데이트
      commands.updateNodePosition(node.id, node.position);
      
      // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
      await events.onNodeDragStop?.(node, evt);
    },
    [events, commands]
  );

  // 노드 더블클릭: Canvas 도메인 콜백 + 포커싱
  const onNodeDoubleClick = useCallback(
    (evt: React.MouseEvent, node: ReactFlowNode) => {
      // Canvas 도메인 콜백 실행 (에디터 패널 열기)
      events.onNodeDoubleClick?.(node, evt);
      
      // 노드 포커싱 (에디터 열 때)
      if (focusOnNode) {
        setTimeout(() => {
          focusOnNode(node.id);
        }, 100);
      }
    },
    [events, focusOnNode]
  );

  // 엣지 더블클릭: Canvas 도메인 콜백만 (UI 변경 없음)
  const onEdgeDoubleClick = useCallback(
    (evt: React.MouseEvent, edge: ReactFlowEdge) => {
      // Canvas 도메인 콜백 실행
      events.onEdgeDoubleClick?.(edge, evt);
    },
    [events]
  );

  // 노드 삭제: Optimistic UI + Canvas 도메인 콜백
  const onNodesDelete = useCallback(
    async (nodes: ReactFlowNode[]) => {
      const nodeIds = nodes.map(node => node.id);
      
      // 1️⃣ Optimistic UI: RF 노드 즉시 삭제
      await commands.deleteNodes(nodeIds);
      
      // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
      // TODO: Canvas 도메인 삭제 콜백 추가
    },
    [commands]
  );
  
  // 엣지 삭제: Optimistic UI + Canvas 도메인 콜백
  const onEdgesDelete = useCallback(
    async (edges: ReactFlowEdge[]) => {
      const edgeIds = edges.map(edge => edge.id);
      
      // 1️⃣ Optimistic UI: RF 엣지 즉시 삭제
      await commands.deleteEdges(edgeIds);
      
      // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
      // TODO: Canvas 도메인 삭제 콜백 추가
    },
    [commands]
  );
  
  // 연결 시작: Canvas 도메인 콜백만
  const onConnectStart = useCallback(() => {
    events.onConnectStart?.(new MouseEvent('connectstart') as any);
  }, [events]);
  
  // 연결 종료: Canvas 도메인 콜백만
  const onConnectEnd = useCallback(() => {
    events.onConnectEnd?.(new MouseEvent('connectend') as any);
  }, [events]);

  // 선택 변경: SelectionContext 상태 업데이트
  const onSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] }) => {
      // 선택된 노드 ID들 추출
      const selectedNodeIds = nodes.map(node => node.id);
      const selectedEdgeIds = edges.map(edge => edge.id);
      
      // SelectionContext 상태 업데이트
      if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
        selectNodes(selectedNodeIds);
        selectEdges(selectedEdgeIds);
      } else {
        clearSelection();
      }
    },
    [selectNodes, selectEdges, clearSelection]
  );

  // 노드 변경: React Flow 내부 처리 (ReactFlowCanvasCommands에서 처리)
  const onNodesChange = useCallback(
    (changes: any[]) => {
      // React Flow 내부 상태만 업데이트 (Canvas 도메인 동기화는 별도 이벤트로 처리)
      console.log('Nodes changed (internal):', changes);
    },
    []
  );

  // 엣지 변경: React Flow 내부 처리 (ReactFlowCanvasCommands에서 처리)
  const onEdgesChange = useCallback(
    (changes: any[]) => {
      // React Flow 내부 상태만 업데이트 (Canvas 도메인 동기화는 별도 이벤트로 처리)
      console.log('Edges changed (internal):', changes);
    },
    []
  );

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
    ]
  );

  return result;
}
