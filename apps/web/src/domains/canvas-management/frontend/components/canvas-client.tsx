'use client';

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { CanvasReactFlowWrapper } from './canvas-react-flow-wrapper';
import { CanvasModeProvider } from '../contexts/canvas-mode-context';
import type { Node, Edge } from '@xyflow/react';

export interface CanvasClientProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
  initialNodes: Node[];
  initialEdges: Edge[];
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
        <div className="h-full flex flex-col bg-gray-50">
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
        </div>
      </CanvasModeProvider>
    </ReactFlowProvider>
  );
}
