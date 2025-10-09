// apps/web/src/domains/organization-management/shared/commands/index.ts

import { OrganizationType } from '../types';
import { MemberRoleType } from '../value-objects/member-role.vo';

export interface CreateDefaultOrganizationCommand {
  userId: string;
  organizationName: string;
}

export interface CreateNewOrganizationCommand {
  name: string;
  organizationType: OrganizationType;
  ownerId: string;
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
