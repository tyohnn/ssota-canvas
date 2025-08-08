"use client";

import React from "react";
import { Canvas } from "./canvas";
import { TopToolbox } from "./canvas-control/top-toolbox";
import { EditorPanel } from "./editor-panel";
import { AIChatPanel } from "./ai-chat-panel";
import { PageBlockInsertPanel } from "./block-control/page-block-insert-panel";
import { BlockInsertPanel } from "./block-control/block-insert-panel";
import { BlockExplorerPanel } from "./block-control/block-explorer-panel";
import {
  CanvasProvider,
  useCanvas,
} from "@/domains/workflow-canvas/contexts/CanvasContext";
import {
  Block,
  Edge as DbEdge,
  BlockPosition as DbBlockPosition,
} from "@/db/schema";
import { DbBlock } from "@/domains/workflow-canvas/policy/block-definition-policy";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@workspace/ui/components/resizable";
import { Button } from "@workspace/ui/components/button";

interface CanvasPageProps {
  workspaceId: string;
  className?: string;
  initialDbBlocks?: DbBlock[];
  initialDbEdges?: DbEdge[];
  initialDbBlockPositions?: DbBlockPosition[];
}

/**
 * Canvas Page Component - Complete canvas layout
 */
export function CanvasPage({
  workspaceId,
  className,
  initialDbBlocks,
  initialDbEdges,
  initialDbBlockPositions,
}: CanvasPageProps) {
  return (
    <CanvasProvider
      workspaceId={workspaceId}
      initialDbBlocks={initialDbBlocks}
      initialDbEdges={initialDbEdges}
      initialDbBlockPositions={initialDbBlockPositions}
    >
      <CanvasPageContent className={className} />
    </CanvasProvider>
  );
}

/**
 * Canvas Page Content - Uses Context
 */
function CanvasPageContent({ className }: { className?: string }) {
  // Context에서 모든 상태와 이벤트 핸들러 가져오기
  const {
    loading,
    error,

    // UI 상태
    showBlockExplorer,
    showPageBlockInsertPanel,
    showBlockInsertPanel,

    // UI 상태 업데이트
    setShowBlockExplorerState,
  } = useCanvas();

  // Handle hydration mismatch by ensuring client-side only execution
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center flex-1 w-full ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading canvas...</p>
          <p className="text-sm text-muted-foreground">
            Preparing your workspace
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center flex-1 w-full ${className}`}
      >
        <div className="text-center">
          <p className="text-lg font-medium text-destructive mb-4">
            Error loading canvas
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex-1 flex flex-col ${className}`}>
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar - Node Explorer */}
          {showBlockExplorer && (
            <>
              <ResizablePanel
                id="block-explorer-panel"
                order={0}
                defaultSize={15}
                minSize={15}
                maxSize={20}
                className="flex flex-col"
              >
                <BlockExplorerPanel />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Component Selection Panel */}
          {showPageBlockInsertPanel && (
            <>
              <ResizablePanel
                id="page-block-insert-panel"
                order={1}
                defaultSize={17}
                minSize={15}
                maxSize={20}
                className="flex flex-col"
              >
                <PageBlockInsertPanel />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Element Selection Panel */}
          {showBlockInsertPanel && (
            <>
              <ResizablePanel
                id="block-insert-panel"
                order={1}
                defaultSize={17}
                minSize={15}
                maxSize={20}
                className="flex flex-col"
              >
                <BlockInsertPanel />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Main Panel - TopToolbox + Canvas Area */}
          <ResizablePanel
            id="main-canvas-panel"
            order={2}
            className="flex-1 flex flex-col relative"
          >
            <TopToolbox />

            {/* Canvas Area */}
            <div className="flex-1">
              {isClient && <Canvas className="h-full" />}
            </div>

            {/* Editor Panel - positioned relative to ResizablePanel */}
            <EditorPanel />
          </ResizablePanel>

          {/* AI Chat Panel */}
          <ResizableHandle />
          <ResizablePanel
            id="ai-chat-panel"
            order={3}
            defaultSize={20}
            minSize={15}
            maxSize={25}
            className="flex flex-col"
          >
            <AIChatPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Floating Action Button for block Explorer */}
      {!showBlockExplorer && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowBlockExplorerState(true)}
          className="fixed bottom-4 left-4 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          title="Open Node Explorer"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </Button>
      )}
    </div>
  );
}
