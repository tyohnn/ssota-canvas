'use client';

import { useCallback } from 'react';
import { useCopyPublishedPage } from '../../../hooks/use-copy-published-page';
import { ShareManagementError } from '../../../../shared/errors/share-management.error';
import { CopyResultDTO } from '../../../../shared/dtos';

interface UseCopyFlowBusinessProps {
  publishToken: string;
  selectedWorkspaceId: string | null;
  onLoginRequired: () => void;
  setError: (error: string | null) => void;
  setResult: (result: 'idle' | 'success' | 'failed') => void;
}

export function useCopyFlowBusiness({
  publishToken,
  selectedWorkspaceId,
  onLoginRequired,
  setError,
  setResult,
}: UseCopyFlowBusinessProps) {
  const copyMutation = useCopyPublishedPage();

  const handleCopy = useCallback(async () => {
    if (!selectedWorkspaceId) return;

    try {
      const response: CopyResultDTO = await copyMutation.mutateAsync({
        publishToken,
        targetWorkspaceId: selectedWorkspaceId,
      });

      if (response.status === 'failed') {
        setResult('failed');
        setError(response.errorMessage ?? 'Failed to copy page');
        return;
      }

      setResult('success');
    } catch (err: unknown) {
      if (err instanceof ShareManagementError && err.code === 'LOGIN_REQUIRED') {
        onLoginRequired();
        return;
      }

      const message = err instanceof Error ? err.message : 'Failed to copy page';
      if (message.includes('Login required')) {
        onLoginRequired();
        return;
      }

      setResult('failed');
      setError(message);
    }
  }, [selectedWorkspaceId, publishToken, copyMutation, onLoginRequired, setError, setResult]);

  return {
    copyMutation,
    handleCopy,
  };
}
