'use client';

import { useCallback, useMemo } from 'react';
import { useCreateWorkspaceDialogUI } from './use-create-workspace-dialog.ui';
import {
  useCreateWorkspaceBusiness,
  type CreateWorkspaceBusinessLogic,
} from './use-create-workspace-dialog.business';
import type {
  CreateWorkspaceFormValues,
  CreateWorkspaceDialogContextValue,
  CreateWorkspaceDialogProps,
} from './types';

/**
 * Combined Hook for CreateWorkspaceDialog
 *
 * Integrates:
 * - UI State (from useCreateWorkspaceDialogUI)
 * - Business Logic (from useCreateWorkspaceBusiness or injected)
 * - Dialog handlers (open/close, invite dialog)
 *
 * Supports optional business logic injection for:
 * - Testing (mock logic)
 * - No-code tools (custom logic)
 * - Production (default logic)
 *
 * Returns complete ContextValue ready for Provider
 */
export function useCreateWorkspaceDialog(
  { open, onOpenChange }: CreateWorkspaceDialogProps,
  businessLogic?: CreateWorkspaceBusinessLogic
): CreateWorkspaceDialogContextValue {
  // UI State (Designer domain)
  const uiState = useCreateWorkspaceDialogUI();

  // Business Logic (Engineer domain)
  const defaultBusiness = useCreateWorkspaceBusiness();
  const business = businessLogic ?? defaultBusiness;

  // Dialog handlers
  const handleCloseDialog = useCallback(() => {
    uiState.resetForm();
    onOpenChange(false);
  }, [uiState, onOpenChange]);

  const handleOpenInviteDialog = useCallback(() => {
    // Close main dialog
    onOpenChange(false);

    // Open invite dialog
    uiState.setIsInviteDialogOpen(true);
  }, [uiState, onOpenChange]);

  // Combined logic: Handle form submission
  const handleSubmit = useCallback(
    async (values: CreateWorkspaceFormValues) => {
      // Validation
      const error = business.validateName?.(values.name);
      if (error) {
        console.warn('Validation error:', error);
        return;
      }

      // Note: Loading state is managed by TanStack Query (business.isCreating)
      // But we keep UI loading state for compatibility
      uiState.setIsLoading(true);

      try {
        // Business: Create workspace (with Optimistic Update)
        const result = await business.createWorkspace(values);

        if (result.success && result.createdInfo) {
          // UI: Store created workspace info
          uiState.setCreatedWorkspace(result.createdInfo);

          // UI: Reset form
          uiState.resetForm();

          // Open invite dialog after successful creation
          handleOpenInviteDialog();
        }
      } finally {
        // UI: Clear loading state
        uiState.setIsLoading(false);
      }
    },
    [uiState, business, handleOpenInviteDialog]
  );

  // Computed loading state
  const isLoading = useMemo(
    () => uiState.isLoading || (business.isCreating ?? false),
    [uiState.isLoading, business.isCreating]
  );

  // Return complete ContextValue
  return useMemo(
    () => ({
    // UI State
      isLoading,
      isInviteDialogOpen: uiState.isInviteDialogOpen,
      createdWorkspace: uiState.createdWorkspace,

      // Business State (TanStack Query)
      isCreating: business.isCreating,

      // Form state
      form: uiState.form,

      // Actions
      setIsInviteDialogOpen: uiState.setIsInviteDialogOpen,
    handleSubmit,
      handleCloseDialog,
    }),
    [uiState, business, isLoading, handleSubmit, handleCloseDialog]
  );
}

export type CreateWorkspaceDialogState = ReturnType<
  typeof useCreateWorkspaceDialog
>;
