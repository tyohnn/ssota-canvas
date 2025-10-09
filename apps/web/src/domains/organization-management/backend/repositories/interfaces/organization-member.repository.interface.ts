// apps/web/src/domains/organization-management/backend/repositories/interfaces/organization-member.repository.interface.ts

import { OrganizationId, UserId } from '../../../shared/value-objects/ids.vo';
import { MemberRole } from '../../../shared/value-objects/member-role.vo';
import {
  OrganizationMemberView,
  UserProfile,
} from '../../../shared/dtos/index';

export interface OrganizationMemberInfo {
  organizationId: OrganizationId;
  userId: UserId;
  role: MemberRole;
  joinedAt: Date;
}

export interface OrganizationMemberRepository {
  // Command methods (도메인 로직)
  addMember(member: OrganizationMemberInfo): Promise<void>;
  removeMember(organizationId: OrganizationId, userId: UserId): Promise<void>;
  findByOrganizationId(
    organizationId: OrganizationId
  ): Promise<OrganizationMemberInfo[]>;
  findByUserId(userId: UserId): Promise<OrganizationMemberInfo[]>;
  findMemberRole(
    organizationId: OrganizationId,
    userId: UserId
  ): Promise<MemberRole | null>;
  isMember(organizationId: OrganizationId, userId: UserId): Promise<boolean>;
  updateMemberRole(
    organizationId: OrganizationId,
    userId: UserId,
    newRole: MemberRole
  ): Promise<void>;

  // Query methods (Read Model - View)
  getOrganizationMemberView(
    organizationId: string,
    currentUserId: string
  ): Promise<OrganizationMemberView>;
  searchUserProfileByEmail(email: string): Promise<UserProfile[]>;
}
