'use client';

import { useState } from 'react';

/**
 * UI State Hook for MembersTab
 *
 * Manages local UI state (클라이언트 상태만):
 * - Invite dialog state
 *
 * ❌ 제거: memberView (서버 상태 → useQuery로 관리)
 * ❌ 제거: isLoadingMembers (서버 상태 → useQuery로 관리)
 *
 * Can be used independently in Storybook
 */
export function useMembersTabUI() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  return {
    isInviteDialogOpen,
    setIsInviteDialogOpen,
  };
}

export type MembersTabUIState = ReturnType<typeof useMembersTabUI>;
