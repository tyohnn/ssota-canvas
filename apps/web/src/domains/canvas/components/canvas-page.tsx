'use client';

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@workspace/ui/components/ui/resizable';
import { ViewProvider } from '@/domains/canvas/contexts/CanvasViewContext';
import { ViewRenderer } from '@/domains/canvas/components/canvas/view-renderer';
import { CanvasHeader } from '@/domains/canvas/components/canvas/canvas-header';

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
            </div>
          </ResizablePanel>

          {/* SSOT Debug Panel */}
          {/* <ResizableHandle />
          <ResizablePanel
            id="ssot-debug-panel"
            order={1}
            defaultSize={25}
            minSize={15}
            maxSize={25}
            className="flex flex-col"
          >
            <SSOTDebugPanel />
          </ResizablePanel> */}
        </ResizablePanelGroup>
      </ViewProvider>
    </div>
  );
}
