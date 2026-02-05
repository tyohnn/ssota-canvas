// apps/web/src/domains/organization-management/shared/commands/index.ts

import { OrganizationType } from '../types';
import { MemberRoleType } from '../value-objects/member-role.vo';

/**
 * 기본 조직 생성 Command (is_default=true)
 * - 사용자 가입 시 자동 생성
 * - Default Workspace + Welcome 페이지 자동 생성
 */
export interface CreateDefaultOrganizationCommand {
  userId: string;
  organizationName: string;
  workspaceTemplate?: 'default'; // Phase 1: default만 지원, Phase 2: 다양한 템플릿 추가 예정
}

/**
 * 일반 조직 생성 Command (is_default=false)
 * - 사용자가 수동으로 생성
 * - Default Workspace + Untitled 페이지 자동 생성
 */
export interface CreateOrganizationCommand {
  name: string;
  organizationType: OrganizationType;
  ownerId: string;
  workspaceTemplate?: 'default'; // Phase 1: default만 지원, Phase 2: 다양한 템플릿 추가 예정
}

export interface GetUserOrganizationsCommand {
  userId: string;
}

export interface SelectInvitationEmailCommand {
  inviteeEmail: string;
  organizationId: string;
}

export interface RequestMemberInvitationCommand {
  organizationId: string;
  inviterUserId: string;
  inviterName: string; // Notification 생성 시 필요
  inviteeEmail: string;
  role: MemberRoleType;
}

export interface AcceptInvitationCommand {
  invitationId: string;
  inviteeUserId: string;
}

export interface RejectInvitationCommand {
  invitationId: string;
  inviteeUserId: string;
}

export interface CreateInvitationNotificationCommand {
  invitationId: string;
  userId: string;
  organizationName: string;
  inviterName: string;
  role: MemberRoleType;
}

export interface MarkNotificationAsReadCommand {
  notificationId: string;
  userId: string;
}

export interface GetUserNotificationsCommand {
  userId: string;
}

export interface ChangeMemberRoleCommand {
  organizationId: string;
  userId: string;
  newRole: MemberRoleType;
  requesterId: string;
}

export interface RemoveMemberCommand {
  organizationId: string;
  userId: string;
  requesterId: string;
}

export interface TransferOwnershipCommand {
  organizationId: string;
  newOwnerId: string;
  currentOwnerId: string;
}

export interface DeleteOrganizationCommand {
  organizationId: string;
  ownerId: string;
}

export interface UpdateOrganizationCommand {
  organizationId: string;
  name?: string;
  iconUrl?: string | null;
}
