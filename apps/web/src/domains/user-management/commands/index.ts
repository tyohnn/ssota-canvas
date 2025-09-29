import { UserId, OrganizationId, MembershipId, UserEmail, MembershipRole } from '../value-objects/ids.vo';

// User Commands
export interface SyncClerkUserCommand {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  status: 'active' | 'soft_deleted' | 'permanently_deleted';
  metadata?: Record<string, any>;
  webhookType: 'user.created' | 'user.updated' | 'user.deleted';
}

export interface LoginUserCommand {
  clerkUserId: string;
  email: string;
  sessionId: string;
  loginMethod: 'email' | 'oauth' | 'sso';
  timestamp: Date;
}

export interface LogoutUserCommand {
  userId: string;
  sessionId: string;
  timestamp: Date;
}

export interface CreateUserFromClerkCommand {
  clerkUserId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface UpdateUserFromClerkCommand {
  clerkUserId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

// Organization Commands
export interface CreateDefaultOrganizationCommand {
  userId: UserId;
  userEmail: string;
  userName: string;
  clerkUserId: string;
  timestamp: Date;
}

export interface CreateOrganizationCommand {
  name: string;
  description?: string;
  slug?: string;
  createdBy: UserId;
  timestamp: Date;
}

export interface UpdateOrganizationCommand {
  organizationId: OrganizationId;
  name?: string;
  description?: string;
  slug?: string;
  updatedBy: UserId;
  timestamp: Date;
}

export interface DeleteOrganizationCommand {
  organizationId: OrganizationId;
  organizationName: string;
  deletedBy: UserId;
  timestamp: Date;
}

export interface RestoreOrganizationCommand {
  organizationId: OrganizationId;
  restoredBy: UserId;
  timestamp: Date;
}

export interface TransferOrganizationOwnershipCommand {
  organizationId: OrganizationId;
  currentOwnerId: UserId;
  newOwnerId: UserId;
  confirmationCode: string;
  timestamp: Date;
}

// Membership Commands
export interface InviteUserToOrganizationCommand {
  organizationId: OrganizationId;
  inviteeEmail: UserEmail;
  inviterId: UserId;
  role: MembershipRole;
  timestamp: Date;
}

export interface AcceptInvitationCommand {
  invitationId: MembershipId;
  userId: UserId;
  timestamp: Date;
}

export interface RejectInvitationCommand {
  invitationId: MembershipId;
  timestamp: Date;
}

export interface ChangeMemberRoleCommand {
  membershipId: MembershipId;
  newRole: MembershipRole;
  changedBy: UserId;
  timestamp: Date;
}

export interface RemoveMemberCommand {
  membershipId: MembershipId;
  removedBy: UserId;
  timestamp: Date;
}

export interface CancelInvitationCommand {
  invitationId: MembershipId;
  cancelledBy: UserId;
  timestamp: Date;
}
