import type { WorkspaceMemberView } from '@/domains/workspace-management/shared/dtos';

/**
 * MembersTab Props (Container)
 */
export interface MembersTabProps {
  workspaceId: string;
  workspaceName: string;
  disableInvite?: boolean;
}

/**
 * Member Row (transformed for UI)
 *
 * Combines current members and pending invitations
 * into a single format for table rendering
 */
export interface MemberRow {
  id: string;
  type: 'member' | 'pending';
  userId?: string;
  name: string;
  email: string;
  profileImageUrl?: string | null;
  dateLabel: string;
  inviterName?: string;
}

/**
 * Hook return value for useMembersTab
 *
 * Container pattern: Returns state for Props passing
 */
export interface MembersTabHookValue {
  // Props
  workspaceId: string;
  disableInvite: boolean;

  // UI State (클라이언트 상태)
  isInviteDialogOpen: boolean;

  // Business State (서버 상태 - useQuery)
  memberView: WorkspaceMemberView | undefined;
  isLoadingMembersQuery: boolean;
  error: Error | null;

  // Data (transformed for UI)
  memberRows: MemberRow[];

  // Actions
  refetch: () => Promise<void>; // ✅ useQuery의 refetch
  setIsInviteDialogOpen: (open: boolean) => void;
}
