'use client';

import React, { createContext, useContext, useEffect } from 'react';
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  OnEdgesChange,
  OnNodesChange,
} from '@xyflow/react';
import { BlockType } from '@/db/schema';

export interface ReactFlowCanvasConfig {
  // 기본 설정
  nodeTypes?: Record<BlockType, React.ComponentType<any>>;
  minZoom?: number;
  maxZoom?: number;
  fitView?: boolean;

  // 상호작용 설정
  nodesDraggable?: boolean;
  elementsSelectable?: boolean;
  selectionOnDrag?: boolean;
  panOnDrag?: number[];

  // 선택 설정
  enableMultiSelection?: boolean;
  enableDragSelection?: boolean;

  // UI 설정
  showControls?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
}
// React Flow Canvas 컨텍스트
export interface ReactFlowCanvasContextValue {
  // 설정
  config: ReactFlowCanvasConfig;

  // React Flow 내장 상태
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
}

// 컨텍스트 생성
const ReactFlowCanvasContext =
  createContext<ReactFlowCanvasContextValue | null>(null);

// 프로바이더 컴포넌트
export function ReactFlowCanvasProvider({
  children,
  config,
  initialNodes = [],
  initialEdges = [],
}: {
  children: React.ReactNode;
  config: ReactFlowCanvasConfig;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}) {
  // React Flow 내장 상태 관리 사용
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // initialNodes와 initialEdges가 변경될 때마다 상태 업데이트
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const contextValue: ReactFlowCanvasContextValue = {
    config,
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
      'useReactFlowCanvas must be used within ReactFlowCanvasProvider'
    );
  }
  return context;
}
