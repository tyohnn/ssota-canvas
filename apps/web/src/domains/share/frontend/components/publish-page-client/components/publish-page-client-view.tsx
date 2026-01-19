'use client';

import React from 'react';

import type { Edge } from '@xyflow/react';

import { SidebarProvider } from '@workspace/ui/components/ui/sidebar';

import { CanvasBase } from '@/domains/canvas-management/frontend/components/canvas-base';
import type { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import { Box } from '@/components/ui/box';

import { PublishedPageHeader } from './published-page-header';
import type { PublishPageClientViewProps } from '../core/types';

/**
 * PublishPageClientView Component
 *
 * 공개 페이지 뷰어 - CanvasBase를 사용하여 readonly 모드로 렌더링
 */
export function PublishPageClientView({
  token,
  title,
  icon,
  pageId,
  initialNodes,
  initialEdges,
}: PublishPageClientViewProps) {
  const publishToken = token;
  const orgId = 'readonly'; // Placeholder for readonly mode
  const workspaceId = 'readonly'; // Placeholder for readonly mode

  return (
    <SidebarProvider defaultOpen={false}>
      <Box className="h-screen w-full bg-background flex flex-col">
        {/* Header Bar */}
        <PublishedPageHeader
          title={title}
          publishToken={publishToken}
        />

        {/* Canvas Content */}
        <Box className="flex-1 relative">
          <CanvasBase
            pageId={pageId}
            orgId={orgId}
            workspaceId={workspaceId}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            readonly={true}
          />
        </Box>
      </Box>
    </SidebarProvider>
  );
}
