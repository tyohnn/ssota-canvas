'use client';

import { useCallback, useMemo } from 'react';
import { useInvitationDetailDialogUI } from './use-invitation-detail-dialog.ui';
import {
  useInvitationDetailBusiness,
  type InvitationDetailBusinessLogic,
} from './use-invitation-detail-dialog.business';
import type {
  InvitationDetailDialogContextValue,
  InvitationDetailDialogProps,
  InvitationStatus,
} from './types';

/**
 * Combined Hook for InvitationDetailDialog
 *
 * Integrates:
 * - UI State (from useInvitationDetailDialogUI)
 * - Business Logic (from useInvitationDetailBusiness or injected)
 * - Dialog handlers (open/close)
 *
 * Supports optional business logic injection for:
 * - Testing (mock logic)
 * - No-code tools (custom logic)
 * - Production (default logic)
 *
 * Returns complete ContextValue ready for Provider
 */
export function useInvitationDetailDialog(
  { open, onOpenChange, invitation }: InvitationDetailDialogProps,
  businessLogic?: InvitationDetailBusinessLogic
): InvitationDetailDialogContextValue {
  // UI State (Designer domain)
  const uiState = useInvitationDetailDialogUI(invitation);

  // Business Logic (Engineer domain)
  const defaultBusiness = useInvitationDetailBusiness();
  const business = businessLogic ?? defaultBusiness;

  // Dialog handlers
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Combined actions
  const handleAccept = useCallback(async () => {
    if (!invitation) return;

    // Note: Loading state is managed by TanStack Query (business.isAccepting)
    // But we keep UI loading state for compatibility
    uiState.setIsProcessing(true);

    try {
      const result = await business.acceptInvitation(invitation.invitationId);
      if (!result.success) {
        // Error is already handled by TanStack Query onError
        return;
      }
    } finally {
      uiState.setIsProcessing(false);
    }
  }, [invitation, business, uiState]);

  const handleReject = useCallback(async () => {
    if (!invitation) return;

    // Note: Loading state is managed by TanStack Query (business.isRejecting)
    // But we keep UI loading state for compatibility
    uiState.setIsProcessing(true);

    try {
      const result = await business.rejectInvitation(invitation.invitationId);
      if (!result.success) {
        // Error is already handled by TanStack Query onError
        return;
      }
    } finally {
      uiState.setIsProcessing(false);
    }
  }, [invitation, business, uiState]);

  // Computed status enum
  const status = useMemo((): InvitationStatus => {
    if (uiState.isPending) return 'pending';
    if (uiState.isAccepted) return 'accepted';
    if (uiState.isRejected) return 'rejected';
    if (uiState.isExpired) return 'expired';
    return 'pending'; // default
  }, [
    uiState.isPending,
    uiState.isAccepted,
    uiState.isRejected,
    uiState.isExpired,
  ]);

  // Computed loading state
  const isLoading = useMemo(
    () =>
      uiState.isProcessing ||
      (business.isAccepting ?? false) ||
      (business.isRejecting ?? false),
    [uiState.isProcessing, business.isAccepting, business.isRejecting]
  );

  // Return complete ContextValue
  return useMemo(
    () => ({
      // Props
      invitation,

      // UI State
      isProcessing: uiState.isProcessing,

      // Business State (TanStack Query)
      isAccepting: business.isAccepting,
      isRejecting: business.isRejecting,

      // Computed state
      status,
      isLoading,

      // Actions
      handleAccept,
      handleReject,
      handleClose,
    }),
    [
      invitation,
      uiState,
      business,
      status,
      isLoading,
      handleAccept,
      handleReject,
      handleClose,
    ]
  );
}

export type InvitationDetailDialogState = ReturnType<
  typeof useInvitationDetailDialog
>;
