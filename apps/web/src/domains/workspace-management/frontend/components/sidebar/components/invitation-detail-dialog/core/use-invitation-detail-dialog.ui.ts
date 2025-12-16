'use client';

import { useState, useCallback, useMemo } from 'react';
import type { InvitationSummaryDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * UI State Hook for InvitationDetailDialog
 *
 * Manages local UI state without business logic:
 * - Processing state
 * - Invitation status computation
 *
 * Can be used independently in no-code tools (Framer, Webflow)
 */
export function useInvitationDetailDialogUI(
  invitation: InvitationSummaryDTO | null
) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Computed state
  const isPending = invitation?.status === 'pending' || false;
  const isAccepted = invitation?.status === 'accepted' || false;
  const isRejected = invitation?.status === 'rejected' || false;
  const isExpired = invitation?.status === 'expired' || false;

  const setProcessingState = useCallback((processing: boolean) => {
    setIsProcessing(processing);
  }, []);

  return {
    isProcessing,
    isPending,
    isAccepted,
    isRejected,
    isExpired,
    setIsProcessing: setProcessingState,
  };
}

export type InvitationDetailDialogUIState = ReturnType<
  typeof useInvitationDetailDialogUI
>;
