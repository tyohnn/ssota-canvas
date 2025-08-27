"use client";

import React from "react";
import { SideExplorer } from "@/domains/react-flow-canvas/components/explorer/side-explorer";
import { EditorPanel } from "./editor/editor-panel";
import { ReactFlowCanvas } from "./react-flow-canvas";
import { RootProvider } from "../providers/root-provider";
import { BlockInsertPanel } from "./block-insert-panel";
import { ReactFlowDebugPanel } from "./debug/react-flow-debug-panel";
import { usePanel } from "../contexts/PanelContext";

/**
 * React Flow Canvas 메인 렌더러
 * Provider 구조와 기본 레이아웃만 관리
 */
export function ReactFlowCanvasRenderer() {
  return (
    <div className="h-full w-full">
      <RootProvider>
        <SideExplorer />
        <EditorPanel />
        <ReactFlowCanvas />
        <BlockInsertPanel />
        <DebugPanelWrapper />
      </RootProvider>
    </div>
  );
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
