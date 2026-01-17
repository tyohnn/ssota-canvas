'use client';

import { useEffect } from 'react';

import type { InviteMemberDialogProps } from './types';
import {
  type InviteMemberDialogBusinessLogic,
  useInviteMemberDialogBusiness,
} from './use-invite-member-dialog.business';
import { useInviteMemberDialogUI } from './use-invite-member-dialog.ui';

/**
 * Combined Hook for InviteMemberDialog (Domain Level v4.0.0)
 *
 * Integrates:
 * - UI State (from useInviteMemberDialogUI)
 * - Business Logic (from useInviteMemberDialogBusiness)
 *
 * Manages:
 * - Email search with debouncing (300ms)
 * - Member selection and removal
 * - Invitation submission
 * - Form reset on close
 */
export function useInviteMemberDialog({
  workspaceId,
  workspaceName,
  open,
  onOpenChange,
  showSkipButton = false,
}: InviteMemberDialogProps) {
  // UI State
  const uiState = useInviteMemberDialogUI();

  // Business Logic
  const business = useInviteMemberDialogBusiness(uiState);

  // Email search with debouncing (300ms)
  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      business.resetForm();
      return;
    }

    if (!uiState.email || uiState.email.length < 3) {
      uiState.setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      business.searchMembers(uiState.email, workspaceId);
    }, 300);

    return () => clearTimeout(timer);
  }, [uiState.email, workspaceId, open]);

  // Handle dialog close
  const handleClose = () => {
    business.resetForm();
    onOpenChange(false);
  };

  // Handle submit
  const handleSubmit = async () => {
    await business.submitInvitation(workspaceId, handleClose);
  };

  return {
    // Props
    workspaceId,
    workspaceName,
    showSkipButton,

    // UI State
    email: uiState.email,
    selectedMembers: uiState.selectedMembers,
    searchResults: uiState.searchResults,
    isSearching: uiState.isSearching,
    isSubmitting: uiState.isSubmitting,
    isLoading: uiState.isLoading,

    // Actions
    setEmail: uiState.setEmail,
    handleMemberSelect: business.selectMember,
    handleRemoveMember: business.removeMember,
    handleSubmit,
    handleClose,
  };
}

export type InviteMemberDialogState = ReturnType<typeof useInviteMemberDialog>;
