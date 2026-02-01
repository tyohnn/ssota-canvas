'use client';

import { useCallback } from 'react';
import type { DuplicateResultDTO } from '@/domains/share/shared/dtos/response';
import { useDuplicatePublishedPage } from '@/domains/share/frontend/hooks/use-duplicate-published-page';

interface UseDuplicateDialogBusinessProps {
  publishToken: string;
  selectedWorkspaceId: string | null;
  onSuccess?: (result: DuplicateResultDTO) => void;
}

export function useDuplicateDialogBusiness({
  publishToken,
  selectedWorkspaceId,
  onSuccess,
}: UseDuplicateDialogBusinessProps) {
  const { duplicatePublishedPage, isDuplicating } = useDuplicatePublishedPage({
    onSuccess: (result) => {
      onSuccess?.(result);
    },
    onError: () => {
      // Error handled silently or by toast notification
    }
  });

  const handleDuplicate = useCallback(async () => {
    if (!selectedWorkspaceId) return;

    await duplicatePublishedPage({
      publishToken,
      targetWorkspaceId: selectedWorkspaceId,
    });
  }, [selectedWorkspaceId, publishToken, duplicatePublishedPage]);

  return {
    isDuplicating,
    handleDuplicate,
  };
}
