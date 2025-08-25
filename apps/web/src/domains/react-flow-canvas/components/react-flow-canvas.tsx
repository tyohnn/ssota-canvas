"use client";

import React from "react";
import {
  ReactFlow,
  Background,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useReactFlowCanvas } from "../contexts/ReactFlowCanvasContext";
import { SelectionBox } from "./selection-box";
import { useReactFlowHandler } from "../handlers/useReactFlowHandler";
import { useReactFlowCanvasControl } from "../hooks/useReactFlowCanvasControl";
import { CanvasToolbar } from "./canvas-toolbar";
import { ComponentCanvasToolbar } from "./component-canvas-toolbar";
import { CanvasViewToolbar } from "./canvas-view-toolbar";
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
  const { state, config, events } = useReactFlowCanvas();

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
    handlePaneMouseDown,
    handlePaneMouseMove,
    handlePaneMouseUp,
    focusOnNode,
  } = useReactFlowCanvasControl({
    onEscape: () => {
      // ESC 키 처리를 Canvas 도메인으로 위임
      events.onEscape?.();
    },
    onClearSelection: () => {
      // 선택 해제를 Canvas 도메인으로 위임
      events.onClearSelection?.();
    },
    onDragSelectionStart: events.onDragSelectionStart,
    onDragSelectionUpdate: events.onDragSelectionUpdate,
    onDragSelectionEnd: events.onDragSelectionEnd,
    onCtrlKeyChange: (pressed) => {
      console.log('Ctrl key changed:', pressed);
    },
    // React Flow 설정 전달
    config
  });

  // React Flow 이벤트 핸들러들 (SelectionProvider 안에서 호출)
  const handlers = useReactFlowHandler({
    focusOnNode,
  });

  return (
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
      selectionOnDrag={selectionOnDrag}
      panOnDrag={panOnDrag as any}
      
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
      onMove={onMove}
      onMouseDown={handlePaneMouseDown}
      onMouseMove={handlePaneMouseMove}
      onMouseUp={handlePaneMouseUp}
    >
      {/* 선택 박스 UI */}
      <SelectionBox />
      
      {/* 선택된 노드 수 표시 */}
      <SelectionStatus />
      
      {/* Canvas 툴바들 */}
      {events.renderCanvasToolbar && (
        <CanvasToolbar
          mode={toolMode === 'connect' ? 'select' : toolMode as 'select' | 'hand'}
          setMode={(mode: 'select' | 'hand') => setToolMode(mode)}
          isAddOpen={events.isAddOpen || false}
          toggleAdd={events.toggleAdd || (() => {})}
          isEditOpen={events.isEditOpen || false}
          toggleEdit={events.toggleEdit || (() => {})}
          onFitToView={handleFitToView}
          isPageSelected={events.isPageSelected || false}
          isPageEditorOpen={events.isPageEditorOpen || false}
        />
      )}
      {events.renderComponentToolbar && (
        <ComponentCanvasToolbar
          onBackToPage={events.onBackToPage || (() => {})}
          isEditOpen={events.isEditOpen || false}
          toggleEdit={events.toggleEdit || (() => {})}
          componentName={events.componentName || null}
          toolMode={toolMode === 'connect' ? 'select' : toolMode as 'select' | 'hand'}
          setToolMode={(mode: 'select' | 'hand') => setToolMode(mode)}
          onFitToView={handleFitToView}
        />
      )}
      {events.renderViewToolbar && (
        <CanvasViewToolbar
          showMiniMap={showMiniMap}
          toggleMiniMap={toggleMiniMap}
          zoomPercent={zoomPercent}
          onZoomPercentChange={onZoomPercentChange}
        />
      )}
      
      {/* UI 컴포넌트들 */}
      {/* {config.showControls && <Controls />} */}
      {config.showBackground && <Background />}
    </ReactFlow>
  );
}
