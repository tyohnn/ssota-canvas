'use client';

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/ui/sonner';
import { updateWorkspaceInfoAction } from '@/domains/workspace-management/actions/workspace.actions';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';
import type { UpdateWorkspaceFormValues } from './types';

/**
 * Business Logic interface for GeneralSettingsForm
 */
export interface GeneralSettingsFormBusinessLogic {
  /**
   * Update workspace information (TanStack Query mutation)
   */
  updateWorkspace: (params: {
    workspaceId: string;
    name: string;
    description?: string | null;
    icon?: string | null;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Loading state (from TanStack Query)
   */
  isUpdating?: boolean;
}

/**
 * Production Business Logic Hook (with TanStack Query)
 *
 * Uses TanStack Query for:
 * - Optimistic updates (instantly update workspace in list)
 * - Automatic rollback on error
 * - Loading state management
 * - Toast notifications
 */
export function useGeneralSettingsFormBusiness(): GeneralSettingsFormBusinessLogic {
  const { setWorkspaces, workspaces } = useWorkspace();

  const updateMutation = useMutation({
    mutationFn: async (params: {
      workspaceId: string;
      name: string;
      description?: string | null;
      icon?: string | null;
    }) => {
      const result = await updateWorkspaceInfoAction({
        workspaceId: params.workspaceId,
        name: params.name,
        description: params.description || null,
        icon: params.icon || null,
      });

      if (!result.success) {
        const errorMessages: Record<string, string> = {
          NOT_WORKSPACE_MEMBER:
            'Only workspace members can modify the workspace',
          NOT_ORG_ADMIN: 'Organization admin permissions are required',
          WORKSPACE_NOT_FOUND: 'Workspace not found',
          UNAUTHORIZED: 'Login is required',
        };
        const errorMessage =
          'error' in result
            ? errorMessages[result.error] || result.error
            : 'Failed to update workspace';
        throw new Error(errorMessage);
      }

      return result;
    },

    // Optimistic update
    onMutate: async params => {
      const previousWorkspaces = workspaces;

      setWorkspaces(prev =>
        prev.map(ws =>
          ws.workspaceId === params.workspaceId
            ? {
                ...ws,
                name: params.name ?? ws.name,
                description: params.description ?? ws.description,
                icon: params.icon ?? ws.icon,
              }
            : ws
        )
      );

      return { previousWorkspaces };
    },

    onSuccess: () => {
      toast.success('Workspace information updated');
    },

    // Auto rollback on error
    onError: (error: Error, params, context) => {
      if (context?.previousWorkspaces) {
        setWorkspaces(context.previousWorkspaces);
      }
      toast.error('Modification failed', { description: error.message });
    },
  });

  const updateWorkspace = useCallback(
    async (params: {
      workspaceId: string;
      name: string;
      description?: string | null;
      icon?: string | null;
    }) => {
      try {
        await updateMutation.mutateAsync(params);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Workspace modification failed',
        };
      }
    },
    [updateMutation]
  );

  return {
    updateWorkspace,
    isUpdating: updateMutation.isPending,
  };
}

/**
 * Mock Business Logic Hook (for Storybook)
 */
export function useMockGeneralSettingsFormBusiness(): GeneralSettingsFormBusinessLogic {
  const updateMutation = useMutation({
    mutationFn: async (params: any) => {
      console.log('[Mock] Updating workspace:', params);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
  });

  const updateWorkspace = useCallback(
    async (params: any) => {
      try {
        await updateMutation.mutateAsync(params);
        return { success: true };
      } catch {
        return { success: false, error: 'Mock error' };
      }
    },
    [updateMutation]
  );

  return {
    updateWorkspace,
    isUpdating: updateMutation.isPending,
  };
}
