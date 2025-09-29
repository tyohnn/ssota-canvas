import { User, Organization, Membership } from './types';

// UI에서 필요한 추가 필드들
export interface UserWithOrganizations extends User {
  // 여러 Aggregate를 조합한 필드들
  organizations: OrganizationSummary[];
  currentOrganizationId?: string;
  // UI 전용 필드들
  isOnline?: boolean;
  lastSeenAt?: Date;
}

export interface OrganizationWithMembers extends Organization {
  // 멤버 정보 포함
  members: MembershipSummary[];
  memberCount: number;
  // UI 전용 필드들
  isSelected?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

// 요약 타입들 (목록 표시용)
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt?: Date;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  isDefault: boolean;
  isSelected: boolean;
}

export interface MembershipSummary {
  id: string;
  user: UserSummary;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active' | 'removed';
  joinedAt?: Date;
  invitedAt?: Date;
}

// 폼 입력용 타입들
export interface OrganizationFormInput {
  name: string;
  slug?: string; // 자동 생성 가능
}

export interface InviteMemberFormInput {
  email: string;
  role: 'admin' | 'member';
}

// Read Models 타입 활용 (Technical Specification에서 정의된 것을 import)
export interface UserOrganizationView {
  // 복합 조회를 위한 Read Model 타입
  user: User;
  organizations: OrganizationWithMembers[];
  currentOrganization?: OrganizationWithMembers;
  aggregatedData: {
    totalOrganizations: number;
    ownedOrganizations: number;
    memberOrganizations: number;
    pendingInvitations: number;
  };
}

export interface OrganizationMemberView {
  organization: Organization;
  members: MembershipSummary[];
  aggregatedData: {
    totalMembers: number;
    activeMembers: number;
    pendingInvitations: number;
    roleDistribution: {
      owners: number;
      admins: number;
      members: number;
    };
  };
}