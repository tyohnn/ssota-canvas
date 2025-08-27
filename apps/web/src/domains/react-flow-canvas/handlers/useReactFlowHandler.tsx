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
  onPaneClick: (event: React.MouseEvent) => void;
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
  onSelectionDragStart: (event: React.MouseEvent) => void;
  onSelectionDrag: (event: React.MouseEvent) => void;
  onSelectionDragStop: (event: React.MouseEvent) => void;
};

export interface UseReactFlowHandlerOptions {
  focusOnNode?: (nodeId: string) => void;
}

export function useReactFlowHandler(options: UseReactFlowHandlerOptions = {}): UseReactFlowHandlerResult {
  const { commands, domainCallbacks } = useReactFlowCanvas();
  const { selectNodes, selectEdges, clearSelection } = useSelectionCommands();
  const { selectedNodeIds } = useSelectionState();
  const { focusOnNode } = options;
  
  // 노드 클릭: React Flow 내장 선택 처리 + Canvas 도메인 콜백
  const onNodeClick = useCallback(
    (evt: React.MouseEvent, node: ReactFlowNode) => {
      evt.preventDefault();
      evt.stopPropagation();
      
      console.log('🖱️ Node clicked:', { nodeId: node.id });
      
      // React Flow가 자동으로 선택 상태를 처리하므로 추가 로직 불필요
      // onSelectionChange에서 SelectionContext와 동기화됨
      
      // Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
      domainCallbacks.onNodeClick?.(node, evt);
    },
    [domainCallbacks, focusOnNode]
  );

  // 엣지 클릭: React Flow 내장 선택 처리 + Canvas 도메인 콜백
  const onEdgeClick = useCallback(
    (evt: React.MouseEvent, edge: ReactFlowEdge) => {
      console.log('🖱️ Edge clicked:', { edgeId: edge.id });
      
      // React Flow가 자동으로 선택 상태를 처리하므로 추가 로직 불필요
      // onSelectionChange에서 SelectionContext와 동기화됨
      
      // Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
      domainCallbacks.onEdgeClick?.(edge, evt);
    },
    [domainCallbacks]
  );

  // 캔버스 클릭: React Flow 내장 선택 처리 + Canvas 도메인 콜백
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    console.log('🖱️ Pane clicked - clearing selection');
    
    // React Flow가 자동으로 선택 해제를 처리하므로 추가 로직 불필요
    // onSelectionChange에서 SelectionContext와 동기화됨
    
    // Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
    domainCallbacks.onPaneClick?.(event);
  }, [domainCallbacks]);

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
    domainCallbacks.onConnect?.(connection);
  }, [domainCallbacks]);

  // 노드 드래그 시작: React Flow 내장 선택 처리 + Canvas 도메인 콜백
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
    console.log('🖱️ Node drag started:', { nodeId: node.id });
    
    // React Flow가 자동으로 선택 상태를 처리하므로 추가 로직 불필요
    // onSelectionChange에서 SelectionContext와 동기화됨
    
    // Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
    domainCallbacks.onNodeDragStart?.(node, event);
  }, [domainCallbacks, commands]);

  // 노드 드래그 종료: Optimistic UI + Canvas 도메인 콜백
  const onNodeDragStop = useCallback(
    async (evt: React.MouseEvent, node: ReactFlowNode) => {
      // 1️⃣ Optimistic UI: RF 노드 위치 즉시 업데이트
      commands.updateNodePosition(node.id, node.position);
      
      // 2️⃣ Canvas 도메인 콜백 실행 (SSOT/DB 업데이트)
      await domainCallbacks.onNodeDragStop?.(node, evt);
    },
    [domainCallbacks, commands]
  );

  // 노드 더블클릭: Canvas 도메인 콜백 + 포커싱
  const onNodeDoubleClick = useCallback(
    (evt: React.MouseEvent, node: ReactFlowNode) => {
      // Canvas 도메인 콜백 실행 (에디터 패널 열기)
      domainCallbacks.onNodeDoubleClick?.(node, evt);
      
      // 노드 포커싱 (에디터 열 때)
      if (focusOnNode) {
        setTimeout(() => {
          focusOnNode(node.id);
        }, 100);
      }
    },
    [domainCallbacks, focusOnNode]
  );

  // 엣지 더블클릭: Canvas 도메인 콜백만 (UI 변경 없음)
  const onEdgeDoubleClick = useCallback(
    (evt: React.MouseEvent, edge: ReactFlowEdge) => {
      // Canvas 도메인 콜백 실행
      domainCallbacks.onEdgeDoubleClick?.(edge, evt);
    },
    [domainCallbacks]
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
    domainCallbacks.onConnectStart?.(new MouseEvent('connectstart') as any);
  }, [domainCallbacks]);
  
  // 연결 종료: Canvas 도메인 콜백만
  const onConnectEnd = useCallback(() => {
    domainCallbacks.onConnectEnd?.(new MouseEvent('connectend') as any);
  }, [domainCallbacks]);

  // 선택 변경: React Flow 내장 이벤트를 사용하여 SelectionContext 동기화
  const onSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] }) => {
      // React Flow의 내장 선택 상태를 SelectionContext와 동기화
      const selectedNodeIds = nodes.map(node => node.id);
      const selectedEdgeIds = edges.map(edge => edge.id);
      
      console.log('🔄 React Flow selection changed:', { selectedNodeIds, selectedEdgeIds });
      
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

  // 드래그 선택 시작: React Flow 내장 이벤트
  const onSelectionDragStart = useCallback(
    (event: React.MouseEvent) => {
      console.log('🎯 Selection drag started');
      // React Flow가 자동으로 처리하므로 추가 로직 불필요
    },
    []
  );

  // 드래그 선택 중: React Flow 내장 이벤트
  const onSelectionDrag = useCallback(
    (event: React.MouseEvent) => {
      // React Flow가 자동으로 처리하므로 추가 로직 불필요
    },
    []
  );

  // 드래그 선택 종료: React Flow 내장 이벤트
  const onSelectionDragStop = useCallback(
    (event: React.MouseEvent) => {
      console.log('✅ Selection drag stopped');
      // React Flow가 자동으로 처리하므로 추가 로직 불필요
    },
    []
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
      onSelectionDragStart,
      onSelectionDrag,
      onSelectionDragStop,
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
    ]
  );

  return result;
}
