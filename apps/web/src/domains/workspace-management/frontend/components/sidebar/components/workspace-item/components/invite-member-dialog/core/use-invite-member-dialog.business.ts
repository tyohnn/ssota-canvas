'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/ui/sonner';
import {
  inviteWorkspaceMemberAction,
  searchOrganizationMembersAction,
} from '@/domains/workspace-management/actions/workspace-member.actions';
import type { OrganizationMemberSearchResultDTO } from '@/domains/workspace-management/shared/dtos';
import type { InviteMemberDialogUIState } from './use-invite-member-dialog.ui';

/**
 * Business logic interface for InviteMemberDialog
 */
export interface InviteMemberDialogBusinessLogic {
  /**
   * Search for organization members by email
   */
  searchMembers: (query: string, workspaceId: string) => Promise<void>;

  /**
   * Select a member to invite
   */
  selectMember: (member: OrganizationMemberSearchResultDTO) => void;

  /**
   * Remove a selected member
   */
  removeMember: (userId: string) => void;

  /**
   * Submit invitation for selected members
   */
  submitInvitation: (
    workspaceId: string,
    onClose?: () => void
  ) => Promise<void>;

  /**
   * Reset all form state
   */
  resetForm: () => void;
}

/**
 * Production Business Logic Hook
 *
 * Handles:
 * - Email search with debouncing (via useEffect in main hook)
 * - Member selection validation
 * - Invitation submission
 * - Cache invalidation after success
 */
export function useInviteMemberDialogBusiness(
  uiState: InviteMemberDialogUIState
): InviteMemberDialogBusinessLogic {
  const queryClient = useQueryClient();

  const searchMembers = async (query: string, workspaceId: string) => {
    if (!query || query.length < 3) {
      uiState.setSearchResults([]);
      return;
    }

    uiState.setIsSearching(true);
    try {
      const result = await searchOrganizationMembersAction({
        workspaceId,
        query,
      });
      if (result.success) {
        uiState.setSearchResults(result.data);
      } else {
        uiState.setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      uiState.setSearchResults([]);
    } finally {
      uiState.setIsSearching(false);
    }
  };

  const selectMember = (member: OrganizationMemberSearchResultDTO) => {
    if (member.isAlreadyMember) {
      toast.error('Already a member', {
        description: 'This user is already a workspace member.',
      });
      return;
    }

    if (member.hasPendingInvitation) {
      toast.error('Invitation pending', {
        description: 'This user already has a pending invitation.',
      });
      return;
    }

    // Duplicate check
    if (uiState.selectedMembers.some(m => m.userId === member.userId)) {
      toast.error('Member already selected');
      return;
    }

    uiState.setSelectedMembers(prev => [...prev, member]);
    uiState.setEmail('');
    uiState.setSearchResults([]);
  };

  const removeMember = (userId: string) => {
    uiState.setSelectedMembers(prev => prev.filter(m => m.userId !== userId));
  };

  const submitInvitation = async (
    workspaceId: string,
    onClose?: () => void
  ) => {
    if (uiState.selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    uiState.setIsSubmitting(true);
    try {
      const emails = uiState.selectedMembers.map(m => m.email);
      const result = await inviteWorkspaceMemberAction({
        workspaceId,
        memberEmails: emails,
      });

      if (result.success) {
        toast.success(
          `${result.data.invitedCount} members invited successfully`
        );
        resetForm();

        // ✅ Mutation 후 캐시 무효화 → useQuery가 자동으로 refetch
        // 5분 이내에 데이터가 변경되어도 즉시 최신 데이터 반영
        queryClient.invalidateQueries({
          queryKey: ['workspace-members', workspaceId],
        });

        onClose?.();
      } else {
        // 사용자 친화적인 에러 메시지
        const errorMessages: Record<string, string> = {
          NOT_ORG_ADMIN: 'Only organization administrators can invite members ',
          NOT_WORKSPACE_MEMBER: 'Only workspace members can invite members',
          WORKSPACE_NOT_FOUND: 'Workspace not found',
          UNAUTHORIZED: 'Login is required',
          INVALID_INPUT: 'Please select at least one member',
        };
        const errorMessage =
          errorMessages[result.error] || 'Failed to invite members';
        toast.error('Invite failed', { description: errorMessage });
      }
    } catch (error) {
      console.error('[inviteMembers] Error:', error);
      toast.error('Failed to invite members');
    } finally {
      uiState.setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    uiState.setSelectedMembers([]);
    uiState.setEmail('');
    uiState.setSearchResults([]);
  };

  return {
    searchMembers,
    selectMember,
    removeMember,
    submitInvitation,
    resetForm,
  };
}
