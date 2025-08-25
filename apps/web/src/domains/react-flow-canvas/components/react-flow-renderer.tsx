"use client";

import React from "react";
import { SideExplorer } from "@/domains/canvas/components/explorer/side-explorer";
import { EditorPanel } from "./editor/editor-panel";
import { ReactFlowCanvas } from "./react-flow-canvas";
import { RootProvider } from "../providers/root-provider";

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
      </RootProvider>
    </div>
  );
}
