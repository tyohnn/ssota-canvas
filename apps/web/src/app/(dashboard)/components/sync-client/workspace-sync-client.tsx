'use client';

import { useEffect } from 'react';

import { useWorkspaceContext } from '@/domains/workspace-management/frontend/contexts/workspace/context';
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

interface WorkspaceSyncClientProps {
  orgId: string;
  workspaces: WorkspaceWithPagesDTO[];
}

/**
 * URL의 orgId에 해당하는 워크스페이스로 WorkspaceContext 동기화.
 * /r/[orgId] 진입 시 서버에서 fetch한 workspaces로 context 업데이트.
 */
export function WorkspaceSyncClient({ orgId, workspaces }: WorkspaceSyncClientProps) {
  const { organizationId, syncWorkspaces } = useWorkspaceContext();

  useEffect(() => {
    if (organizationId !== orgId) {
      syncWorkspaces(workspaces, orgId);
    }
  }, [orgId, workspaces, organizationId, syncWorkspaces]);

  return null;
}
