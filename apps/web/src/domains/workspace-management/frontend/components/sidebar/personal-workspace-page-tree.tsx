'use client';

import React from 'react';
import type { WorkspaceWithPagesDTO } from '../../../shared/dtos';
import { WorkspaceItem } from './workspace-item';

interface PersonalWorkspacePageTreeProps {
  workspaces: WorkspaceWithPagesDTO[];
}

/**
 * Personal Workspace Page Tree
 *
 * 개인 Workspace의 Page 트리를 렌더링
 * - isPersonal=true인 워크스페이스만 표시
 * - 섹션 레이블로 이미 구분되므로 개별 배지 불필요
 */
export function PersonalWorkspacePageTree({
  workspaces,
}: PersonalWorkspacePageTreeProps) {
  if (workspaces.length === 0) {
    return (
      <div className="px-2 text-xs text-muted-foreground">
        No personal workspaces found
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
