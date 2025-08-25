"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import type { Node, Edge, ReactFlowInstance } from "@xyflow/react";
import { useNodesState, useEdgesState } from "@xyflow/react";
import type {
  ReactFlowCanvasContextValue,
  ReactFlowCanvasState,
  ReactFlowCanvasCommands,
  ReactFlowCanvasEvents,
  ReactFlowCanvasConfig,
} from "../types/react-flow-types";
import type { DragSelectionState } from "../types/selection-types";

// 초기 상태
const initialState: ReactFlowCanvasState = {};

// 액션 타입
type ReactFlowCanvasAction = never;

// 리듀서
function reactFlowCanvasReducer(
  state: ReactFlowCanvasState,
  action: ReactFlowCanvasAction
): ReactFlowCanvasState {
  return state;
}

// 컨텍스트 생성
const ReactFlowCanvasContext = createContext<ReactFlowCanvasContextValue | null>(null);

// 프로바이더 컴포넌트
export function ReactFlowCanvasProvider({
  children,
  config,
  events,
  initialNodes = [],
  initialEdges = [],
}: {
  children: React.ReactNode;
  config: ReactFlowCanvasConfig;
  events?: Partial<ReactFlowCanvasEvents>;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}) {
  const [state, dispatch] = useReducer(reactFlowCanvasReducer, initialState);
  const [rfInstance, setRfInstance] = React.useState<ReactFlowInstance | null>(null);

  // React Flow 내장 상태 관리 사용
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 노드/엣지 상태 동기화
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // 명령들
  const commands: ReactFlowCanvasCommands = {
    updateNodePosition: useCallback((nodeId: string, position: { x: number; y: number }) => {
      // React Flow 내장 상태 직접 업데이트
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, position } : node
        )
      );
    }, [setNodes]),

    updateNodeData: useCallback((nodeId: string, data: any) => {
      // React Flow 내장 상태 직접 업데이트
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      );
    }, [setNodes]),

    deleteNodes: useCallback((nodeIds: string[]) => {
      // React Flow 내장 상태 직접 업데이트
      setNodes((nds) => nds.filter((node) => !nodeIds.includes(node.id)));
    }, [setNodes]),

    updateEdgeData: useCallback((edgeId: string, data: any) => {
      // React Flow 내장 상태 직접 업데이트
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === edgeId
            ? { ...edge, data: { ...edge.data, ...data } }
            : edge
        )
      );
    }, [setEdges]),

    deleteEdges: useCallback((edgeIds: string[]) => {
      // React Flow 내장 상태 직접 업데이트
      setEdges((eds) => eds.filter((edge) => !edgeIds.includes(edge.id)));
    }, [setEdges]),

    fitView: useCallback((options?: { padding?: number; duration?: number }) => {
      if (rfInstance?.fitView) {
        rfInstance.fitView(options);
      }
    }, [rfInstance]),

    zoomTo: useCallback((zoom: number) => {
      if (rfInstance?.setViewport) {
        const currentViewport = rfInstance.getViewport();
        rfInstance.setViewport({ ...currentViewport, zoom });
      }
    }, [rfInstance]),
  };

  const contextValue: ReactFlowCanvasContextValue = {
    state,
    commands,
    events: events || {},
    config,
    rfInstance,
    setRfInstance,
    // React Flow 내장 상태 노출
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
  };

  return (
    <ReactFlowCanvasContext.Provider value={contextValue}>
      {children}
    </ReactFlowCanvasContext.Provider>
  );
}

// 훅
export function useReactFlowCanvas() {
  const context = useContext(ReactFlowCanvasContext);
  if (!context) {
    throw new Error(
      "useReactFlowCanvas must be used within ReactFlowCanvasProvider"
    );
  }
  return context;
}
