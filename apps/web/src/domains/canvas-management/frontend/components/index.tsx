'use client';

import React from 'react';

import type { Edge } from '@xyflow/react';

import type { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';

import { CanvasBase, type CanvasBaseProps } from './canvas-base';

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
 * CanvasBase의 래퍼로 readonly={false} 전달
 */
export function CanvasClient({
  pageId,
  orgId,
  workspaceId,
  initialNodes,
  initialEdges,
}: CanvasClientProps) {
  return (
    <CanvasBase
      pageId={pageId}
      orgId={orgId}
      workspaceId={workspaceId}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      readonly={false}
    />
  );
}
