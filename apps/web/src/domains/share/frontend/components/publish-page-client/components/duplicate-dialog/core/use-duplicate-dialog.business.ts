'use client';

import { useCallback } from 'react';
import { useDuplicatePublishedPage } from '@/domains/share/frontend/hooks/use-duplicate-published-page';

interface UseDuplicateDialogBusinessProps {
  publishToken: string;
  selectedWorkspaceId: string | null;
  onSuccess?: () => void;
}

export function useDuplicateDialogBusiness({
  publishToken,
  selectedWorkspaceId,
  onSuccess,
}: UseDuplicateDialogBusinessProps) {
  const { duplicatePublishedPage, isDuplicating } = useDuplicatePublishedPage({
    onSuccess: () => {
      onSuccess?.();
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
