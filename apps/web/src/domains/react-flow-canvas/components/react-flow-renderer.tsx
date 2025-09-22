"use client";

import React from "react";
import { SideExplorer } from "@/domains/react-flow-canvas/components/explorer/side-explorer";
import { EditorPanel } from "./editor/editor-panel";
import { ReactFlowCanvas } from "./react-flow-canvas";
import { RootProvider } from "../providers/root-provider";
import { BlockInsertPanel } from "./block-insert-panel";
import { ReactFlowDebugPanel } from "./debug/react-flow-debug-panel";
import { usePanel } from "../contexts/PanelContext";
import { ReactFlowCommandsProvider } from "../contexts/ReactFlowCommandsContext";
import { useReactFlowNodeSelection } from "../contexts/ReactFlowSelectionContext";
import { ReactFlowCanvasConfig } from "../contexts/ReactFlowCanvasContext";
import { Node, Edge } from "@xyflow/react";

/**
 * React Flow Canvas 메인 렌더러
 * Provider 구조와 기본 레이아웃만 관리
 */
export function ReactFlowCanvasRenderer({
  config,
  defaultNodes,
  defaultEdges,
}: {
  config: ReactFlowCanvasConfig;
  defaultNodes: Node[];
  defaultEdges: Edge[];
}) {
  return (
    <div className="h-full w-full">
      <RootProvider>
        <ReactFlowCommandsProvider>
          <SideExplorer />
          <EditorPanelWrapper />
          <ReactFlowCanvas config={config} defaultNodes={defaultNodes} defaultEdges={defaultEdges} />
          <BlockInsertPanel />
          <DebugPanelWrapper />
        </ReactFlowCommandsProvider>
      </RootProvider>
    </div>
  );
}

function EditorPanelWrapper() {
  const { showEditorPanel } = usePanel();
  const { isSingleSelected } = useReactFlowNodeSelection();
  
  if (!showEditorPanel || !isSingleSelected) return null;
  
  return <EditorPanel />;
}

function DebugPanelWrapper() {
  const { showDebugPanel } = usePanel();
  
  if (!showDebugPanel) return null;
  
  return (
    <div className="fixed top-4 right-4 w-96 h-96 z-50 bg-background border rounded-lg shadow-lg">
      <ReactFlowDebugPanel />
    </div>
  );
}
