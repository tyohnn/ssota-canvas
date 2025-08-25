"use client";

import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useUiLayout } from "@/domains/canvas/contexts/UiLayoutContext";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@workspace/ui/components/ui/resizable";
import { SideExplorer } from "@/domains/canvas/components/explorer/side-explorer";
import { ViewProvider } from "@/domains/canvas/contexts/ViewContext";
import { ViewRenderer } from "@/domains/canvas/components/canvas/view-renderer";
import { BlockInsertPanel } from "@/domains/canvas/components/block-insert-panel";
import { EditorPanel } from "@/domains/canvas/components/editor/editor-panel";
import { CanvasHeader } from "@/domains/canvas/components/canvas/canvas-header";
import { SSOTDebugPanel } from "@/domains/canvas/components/debug/ssot-debug-panel";

interface CanvasPageContentProps {
  workspaceId: string;
}

export function CanvasPageContent({ workspaceId }: CanvasPageContentProps) {
  return (
    <div className={`h-full flex-1 flex flex-col overflow-hidden`}>
      {/* Integrated Header */}
      <ViewProvider>
        <CanvasHeader workspaceId={workspaceId} />

        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Main Panel - Canvas Area */}
          <ResizablePanel
            id="main-canvas-panel"
            order={0}
            className="flex-1 flex flex-col relative"
          >
            {/* View Area */}
            <div className="flex-1 relative">
              <ViewRenderer />

              {/* Side Explorer - 좌측에 고정 */}
              {/* <SideExplorer /> */}

              {/* Block Insert Panel - 좌측에 배치 */}
              <BlockInsertPanel />

              {/* Editor Panel - 우측에 배치 */}
              {/* <EditorPanel /> */}
            </div>
          </ResizablePanel>

          {/* SSOT Debug Panel */}
          <ResizableHandle />
          <ResizablePanel
            id="ssot-debug-panel"
            order={1}
            defaultSize={25}
            minSize={15}
            maxSize={25}
            className="flex flex-col"
          >
            <SSOTDebugPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ViewProvider>
    </div>
  );
}
