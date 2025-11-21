'use client';

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { CanvasReactFlowWrapper } from './canvas-react-flow-wrapper';
import { CanvasModeProvider } from '../../contexts/canvas-mode-context';
import { EditorPanel } from '@/domains/block-management/frontend/components/editor-panel';
import { useCanvasMode } from '../../hooks/use-canvas-mode';
import type { Edge } from '@xyflow/react';
import type { CustomNodeType } from '../../acl/react-flow.acl';

export interface CanvasClientProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
  initialNodes: CustomNodeType[];
  initialEdges: Edge[];
}

/**
 * Editor Panel Wrapper Component
 *
 * React Flow 바깥에서 에디터 패널을 렌더링하는 컴포넌트
 */
function EditorPanelWrapper() {
  const canvasMode = useCanvasMode();

  if (!canvasMode.isBlockEditingMode()) {
    return null;
  }

  const blockId =
    canvasMode.mode.type === 'block-editing' ? canvasMode.mode.blockId : '';

  return <EditorPanel blockId={blockId} isOpen={true} />;
}

/**
 * Canvas Client Component
 *
 * 클라이언트 사이드에서 React Flow와 상호작용하는 컴포넌트
 */
export function CanvasClient({
  pageId,
  orgId,
  workspaceId,
  initialNodes,
  initialEdges,
}: CanvasClientProps) {
  return (
    <ReactFlowProvider>
      <CanvasModeProvider>
        <div className="h-full flex flex-col bg-background">
          {/* 메인 캔버스 영역 */}
          <main className="flex-1 relative overflow-hidden">
            <CanvasReactFlowWrapper
              pageId={pageId}
              orgId={orgId}
              workspaceId={workspaceId}
              initialNodes={initialNodes}
              initialEdges={initialEdges}
            />
          </main>

          {/* Editor Panel (React Flow 바깥에서 렌더링) */}
          <EditorPanelWrapper />
        </div>
      </CanvasModeProvider>
    </ReactFlowProvider>
  );
}
