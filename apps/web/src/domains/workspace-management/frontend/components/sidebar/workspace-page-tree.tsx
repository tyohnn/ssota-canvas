'use client';

import React from 'react';
import type { WorkspaceWithPagesDTO } from '../../../shared/dtos';
import { WorkspaceItem } from './workspace-item';

interface WorkspacePageTreeProps {
  workspaces: WorkspaceWithPagesDTO[];
}

/**
 * Workspace Page Tree
 *
 * 모든 Workspace의 Page 트리를 렌더링
 * - Default Workspace가 최상단 (Backend에서 정렬됨)
 */
export function WorkspacePageTree({ workspaces }: WorkspacePageTreeProps) {
  if (workspaces.length === 0) {
    return (
      <div className="px-2 py-4 text-sm text-muted-foreground">
        No workspaces found
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {workspaces.map(workspace => (
        <WorkspaceItem key={workspace.workspaceId} workspace={workspace} />
      ))}
    </div>
  );
}

