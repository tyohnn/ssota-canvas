'use client';

import React from 'react';

import { ReactFlowProvider } from '@xyflow/react';
import type { Edge } from '@xyflow/react';

import { Box } from '@/components/ui/box';
import type { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import { BlockInteractionProvider } from '@/domains/canvas-management/frontend/contexts/block-interaction-context';
import { CanvasMetadataProvider } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import {
  CanvasReadOnlyProvider,
} from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { CanvasModeProvider } from '@/domains/canvas-management/frontend/hooks/mode/canvas-mode-context';
import { CanvasdownProvider } from '@/domains/canvasdown/frontend/contexts/canvasdown-context';
import { VisualSummaryProvider } from '@/domains/ai-visual-summary/frontend/contexts/visual-summary-context';

import { EditorPanelWrapper } from './editor-panel-wrapper';
import { CanvasReactFlowWrapper } from './react-flow-wrapper';

export interface CanvasBaseProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
  initialNodes: CustomNodeType[];
  initialEdges: Edge[];
  readonly?: boolean;
  publishToken?: string;
  children?: React.ReactNode;
}

/**
 * Canvas Base Component
 *
 * 공통 베이스 컴포넌트로 CanvasClient와 PublishedPageViewer가 공유
 * - readonly 모드를 Context로 전파
 * - 편집 전용 기능은 조건부 렌더링
 */
export function CanvasBase({
  pageId,
  orgId,
  workspaceId,
  initialNodes,
  initialEdges,
  readonly = false,
  publishToken,
  children,
}: CanvasBaseProps) {
  // 여기서는 props로 전달할 필요 없음 (하위 호환성을 위해 props는 유지)
  return (
    <ReactFlowProvider>
      <CanvasModeProvider>
        <BlockInteractionProvider>
          <CanvasMetadataProvider value={{ pageId, orgId, workspaceId }}>
            <CanvasReadOnlyProvider readonly={readonly} publishToken={publishToken}>
              <CanvasdownProvider pageId={pageId}>
                <VisualSummaryProvider>
                  <Box className="h-full flex flex-col bg-background">
                    {/* 메인 캔버스 영역 */}
                    <CanvasReactFlowWrapper
                      initialNodes={initialNodes}
                      initialEdges={initialEdges}
                    />
                    {/* Editor Panel (React Flow 바깥에서 렌더링) */}
                    <EditorPanelWrapper />
                    {/* Children (e.g., PublishedPageHeader) */}
                    {children}
                  </Box>
                </VisualSummaryProvider>
              </CanvasdownProvider>
            </CanvasReadOnlyProvider>
          </CanvasMetadataProvider>
        </BlockInteractionProvider>
      </CanvasModeProvider>
    </ReactFlowProvider>
  );
}
