import { createContext } from 'react';
import { User, Organization, Membership } from '@/domains/user-management/types';
import { UserOrganizationView, OrganizationMemberView } from '@/domains/user-management/client-types';

// Context 상태 타입
interface UserManagementState {
  // 도메인 엔티티들
  currentUser: User | null;
  organizations: Organization[];
  memberships: Membership[];

  // Read Models (복합 조회 데이터)
  userOrganizationView: UserOrganizationView | null;
  organizationMemberView: OrganizationMemberView | null;

  // UI 상태
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isCreatingOrganization: boolean;
  isInvitingMember: boolean;
  isLoadingView: boolean;

  // 에러 상태
  error: string | null;
}

// Context 액션 타입 (Software Design의 Command들 기반)
interface UserManagementActions {
  // 주요 액션들 (Command 이름 기반)
  loginUser: (clerkUserId: string, email: string, sessionId: string, loginMethod: 'email' | 'oauth' | 'sso') => Promise<void>;
  logoutUser: (userId: string, sessionId: string) => Promise<void>;
  selectOrganization: (organizationId: string) => Promise<void>;
  createOrganization: (name: string, slug?: string) => Promise<void>;
  updateOrganization: (organizationId: string, name: string, slug: string) => Promise<void>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  restoreOrganization: (organizationId: string) => Promise<void>;
  transferOwnership: (organizationId: string, newOwnerId: string) => Promise<void>;
  inviteMember: (organizationId: string, email: string, role: 'admin' | 'member') => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  changeMemberRole: (membershipId: string, newRole: 'admin' | 'member') => Promise<void>;
  removeMember: (membershipId: string) => Promise<void>;
  cancelInvitation: (membershipId: string) => Promise<void>;

  // 조회/새로고침 액션들
  refreshUserOrganizations: () => Promise<void>;
  refreshOrganizationMembers: (organizationId: string) => Promise<void>;
  loadUserOrganizationView: () => Promise<void>;
  loadOrganizationMemberView: (organizationId: string) => Promise<void>;

  // 에러 처리
  clearError: () => void;
}

// Context 타입
interface UserManagementContextType {
  state: UserManagementState;
  actions: UserManagementActions;
}

const UserManagementContext = createContext<UserManagementContextType | null>(null);

export { UserManagementContext };
export type { UserManagementState, UserManagementActions, UserManagementContextType };