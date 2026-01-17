'use client';

import React from 'react';

import { ReactFlowProvider } from '@xyflow/react';
import type { Edge } from '@xyflow/react';

import { Box } from '@/components/ui/box';
import type { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import { BlockInteractionProvider } from '@/domains/canvas-management/frontend/contexts/block-interaction-context';
import { CanvasMetadataProvider } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { CanvasModeProvider } from '@/domains/canvas-management/frontend/hooks/mode/canvas-mode-context';

import { EditorPanelWrapper } from './editor-panel-wrapper';
import { CanvasReactFlowWrapper } from './react-flow-wrapper';

export interface CanvasClientProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
  initialNodes: CustomNodeType[];
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
        <BlockInteractionProvider>
          <CanvasMetadataProvider value={{ pageId, orgId, workspaceId }}>
            <Box className="h-full flex flex-col bg-background">
              {/* 메인 캔버스 영역 */}
              <CanvasReactFlowWrapper
                initialNodes={initialNodes}
                initialEdges={initialEdges}
              />
              {/* Editor Panel (React Flow 바깥에서 렌더링) */}
              <EditorPanelWrapper />
            </Box>
          </CanvasMetadataProvider>
        </BlockInteractionProvider>
      </CanvasModeProvider>
    </ReactFlowProvider>
  );
}
