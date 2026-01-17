'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGetAllWorkspacesByOrg } from '@/domains/workspace-management/frontend/hooks/use-get-all-workspaces-by-org';
import type { WorkspaceWithOrgDTO } from '@/domains/workspace-management/shared/dtos';
import { useCopyFlowUI } from './use-copy-flow.ui';
import { useCopyFlowBusiness } from './use-copy-flow.business';

interface UseCopyFlowProps {
  publishToken: string;
  isOpen: boolean;
  onClose: () => void;
  onLoginRequired: () => void;
}

export function useCopyFlow({
  publishToken,
  isOpen,
  onClose,
  onLoginRequired,
}: UseCopyFlowProps) {
  const ui = useCopyFlowUI();

  const { getAllWorkspacesByOrg, isGettingWorkspaces } = useGetAllWorkspacesByOrg({
    onError: () => {
      ui.setError('Failed to load workspaces');
    },
  });

  const [workspaces, setWorkspaces] = useState<WorkspaceWithOrgDTO[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [workspacesError, setWorkspacesError] = useState<Error | null>(null);

  // 워크스페이스 조회 (모든 조직의 워크스페이스를 가져와서 플랫한 배열로 변환)
  const loadWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    setWorkspacesError(null);
    try {
      const result = await getAllWorkspacesByOrg();
      if (result) {
        // org별 그룹핑된 구조를 플랫한 배열로 변환
        const flatWorkspaces = result.organizations.flatMap(org =>
          org.workspaces.map(ws => ({
            id: ws.id,
            name: ws.name,
            icon: ws.icon,
            organizationName: org.name,
          }))
        );
        setWorkspaces(flatWorkspaces);
      } else {
        setWorkspaces([]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load workspaces');
      setWorkspacesError(error);
      const message = error.message;
      if (message.includes('Login required') || message.includes('Unauthorized')) {
        onLoginRequired();
        onClose();
      } else {
        ui.setError(message);
      }
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, [getAllWorkspacesByOrg, onLoginRequired, onClose, ui]);

  const business = useCopyFlowBusiness({
    publishToken,
    selectedWorkspaceId: ui.selectedWorkspaceId,
    onLoginRequired,
    setError: ui.setError,
    setResult: ui.setResult,
  });

  // 초기 워크스페이스 선택
  useEffect(() => {
    if (isOpen && !ui.selectedWorkspaceId && workspaces.length > 0) {
      ui.setSelectedWorkspaceId(workspaces[0]?.id ?? null);
    }
  }, [isOpen, ui.selectedWorkspaceId, workspaces, ui]);

  // 다이얼로그가 열릴 때 데이터 리프레시
  useEffect(() => {
    if (isOpen) {
      loadWorkspaces();
      ui.setResult('idle');
      ui.setError(null);
    }
  }, [isOpen, loadWorkspaces, ui]);

  return {
    ...ui,
    ...business,
    workspaces,
    isLoading: isLoadingWorkspaces || isGettingWorkspaces || business.isCopying,
    error: ui.error || (workspacesError ? workspacesError.message : null),
  };
}
