"use client";

import React from "react";
import {
  ReactFlow,
  Background,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useReactFlowCanvas } from "../contexts/ReactFlowCanvasContext";

import { useReactFlowHandler } from "../handlers/useReactFlowHandler";
import { useReactFlowCanvasControl } from "../hooks/useReactFlowCanvasControl";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { CanvasToolbar } from "./toolbar/canvas-toolbar";
import { ComponentCanvasToolbar } from "./toolbar/component-canvas-toolbar";
import { CanvasViewToolbar } from "./toolbar/canvas-view-toolbar";
import { SelectionStatus } from "./selection-status";
import {
  BasicTextNode,
  ShapeNode,
  FileNode,
  MathFormulaNode,
  YoutubeNode,
  VideoNode,
  ImageNode,
  WebviewNode,
  TwitterPreviewNode,
} from "../nodes";

/**
 * ReactFlow 컴포넌트 - SelectionProvider 안에서 사용
 */
export function ReactFlowCanvas() {
  const { state, config, domainCallbacks } = useReactFlowCanvas();
  
  // Canvas 도메인 컨텍스트 사용
  const { canvasMode, pageId, componentId } = useCanvasSelection();
  const { blocksById } = useCanvasData();
  
  // 툴바 렌더링 조건 계산
  const selectedPageBlock = pageId ? blocksById[pageId] : null;
  const selectedComponentBlock = componentId ? blocksById[componentId] : null;
  const shouldShowCanvasToolbar = canvasMode === "page" && selectedPageBlock;
  const shouldShowComponentToolbar = canvasMode === "component" && selectedComponentBlock;

  // 노드 타입 정의 - React Flow Canvas 도메인에서 직접 관리
  const nodeTypes = {
    shape: ShapeNode,
    basic_text: BasicTextNode,
    image: ImageNode,
    webview: WebviewNode,
    twitter_preview: TwitterPreviewNode,
    video: VideoNode,
    math_formula: MathFormulaNode,
    file: FileNode,
    youtube: YoutubeNode,
  };

  // React Flow 내장 상태 사용 (컨텍스트에서 제공)
  const { nodes, edges, onNodesChange, onEdgesChange } = useReactFlowCanvas();

  // Canvas 컨트롤 (드래그 선택, 키보드 단축키 등)
  const {
    toolMode,
    setToolMode,
    showMiniMap,
    zoomPercent,
    panOnDrag,
    nodesDraggable,
    elementsSelectable,
    selectionOnDrag,
    handleFitToView,
    toggleMiniMap,
    onZoomPercentChange,
    onInit,
    onMove,
    focusOnNode,
  } = useReactFlowCanvasControl({
    // React Flow 설정 전달
    config
  });

  // React Flow 이벤트 핸들러들 (SelectionProvider 안에서 호출)
  const handlers = useReactFlowHandler({
    focusOnNode,
  });

  return (
    <div className={`w-full h-full ${toolMode === "hand" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}>
      <ReactFlow
        // React Flow Hooks 상태 사용
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        
        // 기본 설정
        nodeTypes={nodeTypes}
        fitView={config.fitView ?? true}
        minZoom={config.minZoom ?? 0.1}
        maxZoom={config.maxZoom ?? 2}
        
        // 상호작용 설정
        nodesDraggable={nodesDraggable}
        elementsSelectable={elementsSelectable}
        selectionOnDrag={selectionOnDrag} // Select 모드일 때만 드래그 선택 활성화
        selectionMode={"partial" as SelectionMode} // 부분적으로 겹치는 노드도 선택
        panOnDrag={panOnDrag}
      
        // 이벤트 핸들러
        onInit={onInit}
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
        onMove={onMove}
      >
        {/* 선택된 노드 수 표시 */}
        <SelectionStatus />
        
        {/* Canvas 툴바들 */}
        {shouldShowCanvasToolbar && (
          <CanvasToolbar onFitToView={handleFitToView} />
        )}
        {shouldShowComponentToolbar && (
          <ComponentCanvasToolbar
            toolMode={toolMode === 'connect' ? 'select' : toolMode as 'select' | 'hand'}
            setToolMode={(mode: 'select' | 'hand') => setToolMode(mode)}
            onFitToView={handleFitToView}
          />
        )}
        <CanvasViewToolbar
          showMiniMap={showMiniMap}
          toggleMiniMap={toggleMiniMap}
          zoomPercent={zoomPercent}
          onZoomPercentChange={onZoomPercentChange}
        />
        
        {/* UI 컴포넌트들 */}
        {/* {config.showControls && <Controls />} */}
        {config.showBackground && <Background />}
      </ReactFlow>
    </div>
  );
}
