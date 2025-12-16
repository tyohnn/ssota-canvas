'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { CreateWorkspaceFormValues, CreatedWorkspaceInfo } from './types';

/**
 * Workspace creation form validation schema
 */
const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Please enter a workspace name')
    .max(100, 'Workspace name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  icon: z.string().optional(),
});

/**
 * UI State Hook for CreateWorkspaceDialog
 *
 * Manages local UI state without business logic:
 * - Form state (react-hook-form)
 * - Loading state
 * - Invite dialog state
 * - Created workspace info
 *
 * Can be used independently in no-code tools (Framer, Webflow)
 */
export function useCreateWorkspaceDialogUI() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [createdWorkspace, setCreatedWorkspace] =
    useState<CreatedWorkspaceInfo | null>(null);

  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Folder',
    },
  });

  const resetForm = useCallback(() => {
    form.reset();
    setCreatedWorkspace(null);
  }, [form]);

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setCreatedWorkspaceInfo = useCallback(
    (workspace: CreatedWorkspaceInfo | null) => {
      setCreatedWorkspace(workspace);
    },
    []
  );

  return {
    // Form state
    form,
    isLoading,
    isInviteDialogOpen,
    createdWorkspace,

    // Actions
    setIsLoading: setLoadingState,
    setIsInviteDialogOpen,
    setCreatedWorkspace: setCreatedWorkspaceInfo,
    resetForm,
  };
}

export type CreateWorkspaceDialogUIState = ReturnType<
  typeof useCreateWorkspaceDialogUI
>;
