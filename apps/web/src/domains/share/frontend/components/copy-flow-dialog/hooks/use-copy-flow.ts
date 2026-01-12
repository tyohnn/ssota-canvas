'use client';

import { useEffect } from 'react';
import { useWorkspaceSelection } from '../../../hooks/use-workspace-selection';
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
  
  const { 
    data: workspaceData, 
    isLoading: isWorkspacesLoading, 
    error: workspacesError,
    refetch: refetchWorkspaces
  } = useWorkspaceSelection();

  const business = useCopyFlowBusiness({
    publishToken,
    selectedWorkspaceId: ui.selectedWorkspaceId,
    onLoginRequired,
    setError: ui.setError,
    setResult: ui.setResult,
  });

  const workspaces = workspaceData?.workspaces ?? [];

  // 초기 워크스페이스 선택
  useEffect(() => {
    if (isOpen && !ui.selectedWorkspaceId && workspaces.length > 0) {
      ui.setSelectedWorkspaceId(workspaces[0]?.id ?? null);
    }
  }, [isOpen, ui.selectedWorkspaceId, workspaces, ui]);

  // 워크스페이스 오류 처리 (로그인 필요 등)
  useEffect(() => {
    if (workspacesError) {
      const message = workspacesError.message;
      if (message.includes('Login required') || message.includes('Unauthorized')) {
        onLoginRequired();
        onClose();
      } else {
        ui.setError(message);
      }
    }
  }, [workspacesError, onLoginRequired, onClose, ui]);

  // 다이얼로그가 열릴 때 데이터 리프레시
  useEffect(() => {
    if (isOpen) {
      refetchWorkspaces();
      ui.setResult('idle');
      ui.setError(null);
    }
  }, [isOpen, refetchWorkspaces, ui]);

  return {
    ...ui,
    ...business,
    workspaces,
    isLoading: isWorkspacesLoading || business.copyMutation.isPending,
    error: ui.error || (workspacesError ? workspacesError.message : null),
  };
}
