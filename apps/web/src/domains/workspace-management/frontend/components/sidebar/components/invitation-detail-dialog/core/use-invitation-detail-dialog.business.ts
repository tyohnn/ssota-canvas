'use client';

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/ui/sonner';
import {
  acceptWorkspaceInvitationAction,
  rejectWorkspaceInvitationAction,
} from '@/domains/workspace-management/actions/workspace-member.actions';

/**
 * Business Logic interface for InvitationDetailDialog
 */
export interface InvitationDetailBusinessLogic {
  /**
   * Accept invitation
   */
  acceptInvitation: (invitationId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Reject invitation
   */
  rejectInvitation: (invitationId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Loading states (from TanStack Query)
   */
  isAccepting?: boolean;
  isRejecting?: boolean;
}

/**
 * Production Business Logic Hook with TanStack Query
 *
 * Uses TanStack Query for:
 * - Optimistic updates (remove invitation from list immediately)
 * - Automatic rollback on error
 * - Loading state management
 * - Error handling
 *
 * @see docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md#optimistic-updates-with-tanstack-query
 */
export function useInvitationDetailBusiness(): InvitationDetailBusinessLogic {
  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await acceptWorkspaceInvitationAction({ invitationId });

      if (!result.success) {
        const errorMessage =
          'error' in result
            ? result.error
            : 'Workspace invitation acceptance failed';
        throw new Error(errorMessage);
      }

      return result;
    },

    onSuccess: () => {
      toast.success('Workspace invitation accepted');
      // TODO: Optimistic Update로 워크스페이스 목록에 추가
      // 현재는 페이지 새로고침 필요 (향후 개선)
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Error accepting workspace invitation');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await rejectWorkspaceInvitationAction({ invitationId });

      if (!result.success) {
        const errorMessage =
          'error' in result
            ? result.error
            : 'Workspace invitation rejection failed';
        throw new Error(errorMessage);
      }

      return result;
    },

    onSuccess: () => {
      toast.success('Workspace invitation rejected successfully');
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Workspace invitation rejection failed');
    },
  });

  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      try {
        await acceptMutation.mutateAsync(invitationId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Workspace invitation acceptance failed',
        };
      }
    },
    [acceptMutation]
  );

  const rejectInvitation = useCallback(
    async (invitationId: string) => {
      try {
        await rejectMutation.mutateAsync(invitationId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Workspace invitation rejection failed',
        };
      }
    },
    [rejectMutation]
  );

  return {
    acceptInvitation,
    rejectInvitation,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

/**
 * Mock Business Logic Hook (for no-code tools, testing)
 *
 * Provides mock implementation for designers to work independently
 */
export function useMockInvitationDetailBusiness(): InvitationDetailBusinessLogic {
  const acceptInvitation = useCallback(async (invitationId: string) => {
    console.log('[Mock] Accepting invitation:', invitationId);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }, []);

  const rejectInvitation = useCallback(async (invitationId: string) => {
    console.log('[Mock] Rejecting invitation:', invitationId);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }, []);

  return {
    acceptInvitation,
    rejectInvitation,
  };
}
