'use client';

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/ui/sonner';
import { createWorkspaceAction } from '@/domains/workspace-management/actions/workspace.actions';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';
import type { CreateWorkspaceFormValues, CreatedWorkspaceInfo } from './types';

/**
 * Business Logic interface for CreateWorkspaceDialog
 */
export interface CreateWorkspaceBusinessLogic {
  /**
   * Create a new workspace
   */
  createWorkspace: (values: CreateWorkspaceFormValues) => Promise<{
    success: boolean;
    workspace?: WorkspaceWithPagesDTO;
    createdInfo?: CreatedWorkspaceInfo;
    error?: string;
  }>;

  /**
   * Validate workspace name (optional)
   */
  validateName?: (name: string) => string | null;

  /**
   * Loading state (from TanStack Query)
   */
  isCreating?: boolean;
}

/**
 * Production Business Logic Hook with TanStack Query
 *
 * Uses TanStack Query for:
 * - Optimistic updates (instantly add workspace to list)
 * - Automatic rollback on error
 * - Loading state management
 * - Error handling
 *
 * @see docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md#optimistic-updates-with-tanstack-query
 */
export function useCreateWorkspaceBusiness(): CreateWorkspaceBusinessLogic {
  const { organizationId, setWorkspaces, workspaces } = useWorkspace();

  const mutation = useMutation({
    // Server action
    mutationFn: async (values: CreateWorkspaceFormValues) => {
      const result = await createWorkspaceAction({
        organizationId,
        name: values.name,
        description: values.description,
        icon: values.icon,
      });

      if (!result.success || !result.data) {
        const errorMessage =
          'error' in result ? result.error : '워크스페이스 생성에 실패했습니다';
        throw new Error(errorMessage);
      }

      return {
        workspaceId: result.data.workspaceId,
        firstPageId: result.data.firstPageId,
        name: values.name,
        description: values.description,
        icon: values.icon,
      };
    },

    // Optimistic update: Add workspace to list immediately
    onMutate: async (values: CreateWorkspaceFormValues) => {
      // Get organization name from existing workspaces
      const organizationName =
        workspaces[0]?.organizationName || 'Organization';

      // Build temporary workspace (will be replaced with real data on success)
      const tempWorkspace: WorkspaceWithPagesDTO = {
        workspaceId: `temp-${Date.now()}`, // Temporary ID
        name: values.name,
        description: values.description || null,
        icon: values.icon || null,
        isDefault: false,
        isPersonal: false,
        ownerId: null,
        pageTree: [
          {
            id: `temp-page-${Date.now()}`,
            title: 'Untitled',
            icon: 'FileText',
            children: [],
            depth: 0,
            isFavorite: false,
            lastModified: new Date().toISOString(),
            parentId: null,
            order: 'a0',
          },
        ],
        pageCount: 1,
        workspaceName: values.name,
        organizationName,
      };

      // Backup current workspaces for rollback
      const previousWorkspaces = workspaces;

      // Optimistically add to list
      setWorkspaces(prev => [...prev, tempWorkspace]);

      // Return context for rollback
      return { previousWorkspaces, tempWorkspace };
    },

    // On success: Replace temporary workspace with real data
    onSuccess: (data, values, context) => {
      const organizationName =
        workspaces[0]?.organizationName || 'Organization';

      const newWorkspace: WorkspaceWithPagesDTO = {
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        isDefault: false,
        isPersonal: false,
        ownerId: null,
        pageTree: [
          {
            id: data.firstPageId,
            title: 'Untitled',
            icon: 'FileText',
            children: [],
            depth: 0,
            isFavorite: false,
            lastModified: new Date().toISOString(),
            parentId: null,
            order: 'a0',
          },
        ],
        pageCount: 1,
        workspaceName: data.name,
        organizationName,
      };

      // Replace temporary workspace with real one
      setWorkspaces(prev =>
        prev.map(ws =>
          ws.workspaceId === context?.tempWorkspace.workspaceId
            ? newWorkspace
            : ws
        )
      );

      // Show success toast
      toast.success('워크스페이스가 생성되었습니다');
    },

    // Auto rollback on error
    onError: (error: Error, values, context) => {
      if (context?.previousWorkspaces) {
        setWorkspaces(context.previousWorkspaces);
      }
      toast.error(error.message || '워크스페이스 생성 중 오류가 발생했습니다');
    },
  });

  const createWorkspace = useCallback(
    async (values: CreateWorkspaceFormValues) => {
      try {
        const data = await mutation.mutateAsync(values);

        return {
          success: true,
          createdInfo: {
            workspaceId: data.workspaceId,
            workspaceName: data.name,
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : '워크스페이스 생성에 실패했습니다',
        };
      }
    },
    [mutation]
  );

  const validateName = useCallback((name: string) => {
    if (!name.trim()) {
      return 'Please enter a workspace name';
    }
    if (name.length > 100) {
      return 'Workspace name must be 100 characters or less';
    }
    return null;
  }, []);

  return {
    createWorkspace,
    validateName,
    isCreating: mutation.isPending, // 🎯 Automatic loading state
  };
}

/**
 * Mock Business Logic Hook (for no-code tools, testing)
 *
 * Provides mock implementation for designers to work independently
 */
export function useMockCreateWorkspaceBusiness(): CreateWorkspaceBusinessLogic {
  const createWorkspace = useCallback(
    async (values: CreateWorkspaceFormValues) => {
      console.log('[Mock] Creating workspace:', values);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockWorkspace: WorkspaceWithPagesDTO = {
        workspaceId: 'mock-workspace-id',
        name: values.name,
        description: values.description || null,
        icon: values.icon || null,
        isDefault: false,
        isPersonal: false,
        ownerId: null,
        pageTree: [],
        pageCount: 1,
        workspaceName: values.name,
        organizationName: 'Mock Organization',
      };

      return {
        success: true,
        workspace: mockWorkspace,
        createdInfo: {
          workspaceId: 'mock-workspace-id',
          workspaceName: values.name,
        },
      };
    },
    []
  );

  return {
    createWorkspace,
  };
}
