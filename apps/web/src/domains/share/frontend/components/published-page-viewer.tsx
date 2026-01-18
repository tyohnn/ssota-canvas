'use client';

import React from 'react';

import type { Edge } from '@xyflow/react';

import { CanvasBase } from '@/domains/canvas-management/frontend/components/canvas-base';
import type { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';

import { PublishedPageHeader } from './published-page-header';

interface PublishedPageViewerProps {
  publishToken: string;
  title: string;
  icon?: string;
  pageId: string;
  orgId: string;
  workspaceId: string;
  initialNodes: CustomNodeType[];
  initialEdges: Edge[];
  onCopyRequested?: () => void;
}

/**
 * Published Page Viewer Component
 *
 * 공개 페이지 뷰어 - CanvasBase를 사용하여 readonly 모드로 렌더링
 */
export function PublishedPageViewer({
  publishToken,
  title,
  icon,
  pageId,
  orgId,
  workspaceId,
  initialNodes,
  initialEdges,
  onCopyRequested,
}: PublishedPageViewerProps) {
  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Header Bar */}
      <PublishedPageHeader
        title={title}
        publishToken={publishToken}
        onCopyRequested={onCopyRequested}
      />

      {/* Canvas Content */}
      <div className="flex-1 relative">
        <CanvasBase
          pageId={pageId}
          orgId={orgId}
          workspaceId={workspaceId}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          readonly={true}
        />
      </div>
    </div>
  );
}
