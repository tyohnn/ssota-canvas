'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type {
  UpdateWorkspaceFormValues,
  GeneralSettingsFormProps,
} from './types';

/**
 * Workspace update form validation schema
 */
const updateWorkspaceSchema = z.object({
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
 * UI State Hook for GeneralSettingsForm
 *
 * Manages local UI state:
 * - Form state (react-hook-form)
 * - Loading state
 *
 * Can be used independently in Storybook
 */
export function useGeneralSettingsFormUI(
  workspace: GeneralSettingsFormProps['workspace']
) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateWorkspaceFormValues>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description || '',
      icon: workspace.icon || 'Folder',
    },
  });

  // Reset form when workspace changes
  useEffect(() => {
    form.reset({
      name: workspace.name,
      description: workspace.description || '',
      icon: workspace.icon || 'Folder',
    });
  }, [workspace, form]);

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    form,
    isLoading,
    setIsLoading: setLoadingState,
  };
}

export type GeneralSettingsFormUIState = ReturnType<
  typeof useGeneralSettingsFormUI
>;
