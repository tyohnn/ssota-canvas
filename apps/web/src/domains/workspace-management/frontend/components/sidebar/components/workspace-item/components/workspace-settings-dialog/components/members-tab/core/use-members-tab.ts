'use client';

import { useMemo } from 'react';
import { useMembersTabUI } from './use-members-tab.ui';
import {
  useMembersTabBusiness,
  type MembersTabBusinessLogic,
  transformMemberViewToRows,
} from './use-members-tab.business';
import type { MembersTabHookValue, MembersTabProps } from './types';

/**
 * Combined Hook for MembersTab (Container Pattern v4.0.0)
 *
 * Integrates:
 * - UI State (from useMembersTabUI) - 클라이언트 상태만
 * - Business Logic (from useMembersTabBusiness) - 서버 상태 (useQuery)
 *
 * ✅ useQuery 장점:
 * - 자동 캐싱: 다이얼로그 닫았다가 열어도 캐시된 데이터 즉시 표시
 * - 자동 refetch: staleTime (5분) 이후 백그라운드 refetch
 * - 중복 요청 방지: 같은 queryKey로 여러 컴포넌트에서 호출해도 한 번만 요청
 * - Mutation 후 캐시 무효화: invite/delete 후 자동 refetch
 *
 * Supports optional business logic injection for:
 * - Testing (mock logic)
 * - Storybook (custom logic)
 * - Production (default logic)
 *
 * Returns Hook value for Container to pass as Props
 */
export function useMembersTab(
  props: MembersTabProps,
  businessLogic?: MembersTabBusinessLogic
): MembersTabHookValue {
  const { workspaceId, disableInvite = false } = props;

  // UI State (클라이언트 상태만)
  const uiState = useMembersTabUI();

  // Business Logic (서버 상태 - useQuery)
  // ✅ useQuery가 자동으로 데이터 fetching, 캐싱, refetch 관리
  const defaultBusiness = useMembersTabBusiness(workspaceId);
  const business = businessLogic ?? defaultBusiness;

  // Transform member view to table rows (business logic)
  const memberRows = useMemo(() => {
    if (!business.memberView) return [];
    return transformMemberViewToRows(business.memberView);
  }, [business.memberView]);

  // Return Hook value for Container
  return useMemo(
    () => ({
      // Props
      workspaceId,
      disableInvite,

      // UI State (클라이언트 상태)
      isInviteDialogOpen: uiState.isInviteDialogOpen,

      // Business State (서버 상태 - useQuery)
      memberView: business.memberView,
      isLoadingMembersQuery: business.isLoadingMembersQuery,
      error: business.error,

      // Data (transformed for UI)
      memberRows,

      // Actions
      refetch: business.refetch, // ✅ useQuery의 refetch 사용
      setIsInviteDialogOpen: uiState.setIsInviteDialogOpen,
    }),
    [workspaceId, disableInvite, uiState, business, memberRows]
  );
}
