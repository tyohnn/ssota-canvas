'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/ui/sonner';
import { getWorkspaceMembersAction } from '@/domains/workspace-management/actions/workspace-member.actions';
import type { WorkspaceMemberView } from '@/domains/workspace-management/shared/dtos';
import type { MemberRow } from './types';

/**
 * Transform WorkspaceMemberView to MemberRow[] for table rendering
 *
 * Business logic: Combines current members and pending invitations
 * into a single array with consistent format
 */
export function transformMemberViewToRows(
  memberView: WorkspaceMemberView
): MemberRow[] {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  return [
    // Current members
    ...memberView.currentMembers.map(member => ({
      id: member.userId,
      type: 'member' as const,
      userId: member.userId,
      name: member.name,
      email: member.email,
      profileImageUrl: member.profileImageUrl,
      dateLabel: formatDate(member.joinedAt),
    })),
    // Pending invitations
    ...memberView.pendingInvitations.map(invitation => ({
      id: invitation.id,
      type: 'pending' as const,
      name: invitation.invitedUserName,
      email: invitation.invitedUserEmail,
      dateLabel: formatDate(invitation.createdAt),
      inviterName: invitation.inviterName,
    })),
  ];
}

/**
 * Business logic interface for MembersTab
 */
export interface MembersTabBusinessLogic {
  /**
   * Member view data (from TanStack Query cache)
   */
  memberView: WorkspaceMemberView | undefined;

  /**
   * Loading state (from TanStack Query)
   */
  isLoadingMembersQuery: boolean;

  /**
   * Error state (from TanStack Query)
   */
  error: Error | null;

  /**
   * Refetch member view (manual refresh)
   */
  refetch: () => Promise<void>;
}

/**
 * Production Business Logic Hook (with TanStack Query useQuery)
 *
 * ✅ 장점:
 * - 자동 캐싱: 다이얼로그 닫았다가 열어도 캐시된 데이터 즉시 표시
 * - 자동 refetch: staleTime (5분) 이후 백그라운드 refetch
 * - 중복 요청 방지: 같은 queryKey로 여러 컴포넌트에서 호출해도 한 번만 요청
 * - 로딩/에러 상태 자동 관리
 * - 캐시 무효화: mutation 후 자동으로 관련 쿼리 무효화 가능
 *
 * 캐싱 동작:
 * - staleTime: 5분 (전역 설정)
 * - 5분 이내: 캐시된 데이터 즉시 표시 (로딩 없음) ⚡
 * - 5분 이후: 캐시 데이터 먼저 보여주고, 백그라운드에서 refetch
 *
 * 다른 사용자 변경사항 반영:
 * - 브라우저 새로고침 시 항상 새로 불러옴 (캐시 초기화)
 */
export function useMembersTabBusiness(
  workspaceId: string,
  enabled: boolean = true
): MembersTabBusinessLogic {
  const {
    data: memberView,
    isLoading: isLoadingMembersQuery,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async (): Promise<WorkspaceMemberView> => {
      const result = await getWorkspaceMembersAction({ workspaceId });

      if (!result.success || !result.data) {
        throw new Error('Failed to load members');
      }

      return result.data;
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5분 (전역 설정과 동일)
    retry: 1, // 전역 설정과 동일
  });

  // Handle errors (TanStack Query v5: onError removed, use useEffect instead)
  useEffect(() => {
    if (error) {
      console.error('[MembersTab] Error loading members:', error);
      toast.error('Failed to load members', {
        description: error.message,
      });
    }
  }, [error]);

  const refetch = async () => {
    await refetchQuery();
  };

  return {
    memberView,
    isLoadingMembersQuery,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Mock Business Logic Hook (for Storybook)
 *
 * Simulates:
 * - Loading delay
 * - Success response
 * - Loading state
 */
export function useMockMembersTabBusiness(
  _workspaceId: string,
  enabled: boolean = true
): MembersTabBusinessLogic {
  const {
    data: memberView,
    isLoading: isLoadingMembersQuery,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['workspace-members-mock', _workspaceId],
    queryFn: async (): Promise<WorkspaceMemberView> => {
      console.log('[Mock] Loading member view...');
      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        workspaceId: _workspaceId,
        workspaceName: 'Mock Workspace',
        currentMembers: [],
        pendingInvitations: [],
      };
    },
    enabled: enabled && !!_workspaceId,
  });

  const refetch = async () => {
    await refetchQuery();
  };

  return {
    memberView,
    isLoadingMembersQuery,
    error: error as Error | null,
    refetch,
  };
}
