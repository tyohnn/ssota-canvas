'use client';

import React from 'react';
import {
  ReactFlow,
  Background,
  SelectionMode,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCanvasData } from '@/domains/canvas/contexts/CanvasDataContext';

import { ReactFlowCanvasConfig } from '../contexts/ReactFlowCanvasContext';
import { useReactFlowHandler } from '../handlers/useReactFlowCallbackHandler';
import { useReactFlowCanvasControl } from '../handlers/useReactFlowCanvasControlHandler';
import { CanvasToolbar } from './toolbar/canvas-toolbar';
import { ComponentCanvasToolbar } from './toolbar/component-canvas-toolbar';
import { CanvasViewToolbar } from './toolbar/canvas-view-toolbar';
import { SelectionStatus } from './selection-status';
import {
  TextNode,
  ShapeNode,
  FileNode,
  MathFormulaNode,
  YoutubeNode,
  VideoNode,
  ImageNode,
  WebviewNode,
  TwitterPreviewNode,
} from '@/domains/blocks/components/nodes';

/**
 * ReactFlow 컴포넌트 - SelectionProvider 안에서 사용
 */
export function ReactFlowCanvas({
  config,
  defaultNodes,
  defaultEdges,
}: {
  config: ReactFlowCanvasConfig;
  defaultNodes: Node[];
  defaultEdges: Edge[];
}) {
  // Canvas 도메인 컨텍스트 사용
  const { canvasMode, selectedPageBlock, selectedComponentBlock } =
    useCanvasData();
  const [nodes, setNode, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdge, onEdgesChange] = useEdgesState(defaultEdges);

  React.useEffect(() => {
    setNode(defaultNodes);
  }, [defaultNodes, setNode]);

  React.useEffect(() => {
    setEdge(defaultEdges);
  }, [defaultEdges, setEdge]);

  // 툴바 렌더링 조건 계산
  const shouldShowCanvasToolbar = canvasMode === 'page' && selectedPageBlock;
  const shouldShowComponentToolbar =
    canvasMode === 'component' && selectedComponentBlock;

  // 노드 타입 정의 - React Flow Canvas 도메인에서 직접 관리
  const nodeTypes = {
    shape: ShapeNode,
    text: TextNode,
    image: ImageNode,
    webview: WebviewNode,
    twitter_preview: TwitterPreviewNode,
    video: VideoNode,
    math_formula: MathFormulaNode,
    file: FileNode,
    youtube: YoutubeNode,
  };

  // Canvas 컨트롤 (드래그 선택, 키보드 단축키 등)
  const {
    toolMode,
    panOnDrag,
    nodesDraggable,
    elementsSelectable,
    selectionOnDrag,
    onMove,
    focusOnNode,
  } = useReactFlowCanvasControl();

  // React Flow 이벤트 핸들러들 (SelectionProvider 안에서 호출)
  const handlers = useReactFlowHandler({
    focusOnNode,
  });

  return (
    <div
      className={`w-full h-full ${toolMode === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      <ReactFlow
        // React Flow Hooks 상태 사용
        // defaultNodes={defaultNodes}
        // defaultEdges={defaultEdges}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // 기본 설정
        nodeTypes={nodeTypes}
        fitView={config.fitView ?? true}
        minZoom={config.minZoom ?? 0.1}
        maxZoom={config.maxZoom ?? 2}
        onlyRenderVisibleElements={true}
        // 상호작용 설정
        nodesDraggable={nodesDraggable}
        elementsSelectable={elementsSelectable}
        selectionOnDrag={selectionOnDrag} // Select 모드일 때만 드래그 선택 활성화
        selectionMode={'partial' as SelectionMode} // 부분적으로 겹치는 노드도 선택
        panOnDrag={panOnDrag}
        // 이벤트 핸들러
        onNodeClick={handlers.onNodeClick}
        onNodeDoubleClick={handlers.onNodeDoubleClick}
        onNodeDragStart={handlers.onNodeDragStart}
        onNodeDragStop={handlers.onNodeDragStop}
        onEdgeClick={handlers.onEdgeClick}
        onEdgeDoubleClick={handlers.onEdgeDoubleClick}
        onPaneClick={handlers.onPaneClick}
        onNodesDelete={handlers.onNodesDelete}
        onEdgesDelete={handlers.onEdgesDelete}
        onConnect={handlers.onConnect}
        onConnectStart={handlers.onConnectStart}
        onConnectEnd={handlers.onConnectEnd}
        onSelectionChange={handlers.onSelectionChange}
        onSelectionDragStart={handlers.onSelectionDragStart}
        onSelectionDrag={handlers.onSelectionDrag}
        onSelectionDragStop={handlers.onSelectionDragStop}
        onDrop={handlers.onDrop}
        onDragOver={handlers.onDragOver}
        onMove={onMove}
      >
        {/* 선택된 노드 수 표시 */}
        <SelectionStatus />

        {/* Canvas 툴바들 */}
        {shouldShowCanvasToolbar && <CanvasToolbar />}
        {shouldShowComponentToolbar && <ComponentCanvasToolbar />}
        <CanvasViewToolbar />

        {/* UI 컴포넌트들 */}
        {/* {config.showControls && <Controls />} */}
        {config.showBackground && <Background />}
      </ReactFlow>
    </div>
  );
}
