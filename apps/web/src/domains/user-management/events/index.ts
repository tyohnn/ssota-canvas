import { UserId, OrganizationId, MembershipId, UserEmail, OrganizationSlug, MembershipRole } from '../value-objects/ids.vo';

// User Events
export class UserCreatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class UserUpdatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class ClerkUserSyncedEvent {
  constructor(
    public readonly userId: string,
    public readonly clerkId: string,
    public readonly email: string,
    public readonly status: 'active' | 'soft_deleted' | 'permanently_deleted',
    public readonly timestamp: Date = new Date()
  ) {}
}

export class UserLoggedInEvent {
  constructor(
    public readonly userId: UserId,
    public readonly clerkUserId: string,
    public readonly sessionId: string,
    public readonly loginMethod: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class UserLoggedOutEvent {
  constructor(
    public readonly userId: UserId,
    public readonly sessionId: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

// Organization Events
export class DefaultOrganizationCreatedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly organizationName: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationCreatedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly name: string,
    public readonly slug: OrganizationSlug,
    public readonly createdBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationUpdatedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly updatedFields: string[],
    public readonly updatedBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationSoftDeletedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly organizationName: string,
    public readonly deletedBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationRestoredEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly organizationName: string,
    public readonly restoredBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OwnershipTransferredEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly previousOwnerId: UserId,
    public readonly newOwnerId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

// Membership Events
export class MemberInvitationSentEvent {
  constructor(
    public readonly invitationId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly inviteeEmail: UserEmail,
    public readonly inviterUserId: UserId,
    public readonly role: MembershipRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class InvitationAcceptedEvent {
  constructor(
    public readonly invitationId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly role: MembershipRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class InvitationRejectedEvent {
  constructor(
    public readonly invitationId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly inviteeEmail: UserEmail,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MemberRoleChangedEvent {
  constructor(
    public readonly membershipId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly oldRole: MembershipRole,
    public readonly newRole: MembershipRole,
    public readonly changedBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MemberRemovedEvent {
  constructor(
    public readonly membershipId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly removedBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class InvitationCancelledEvent {
  constructor(
    public readonly invitationId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly inviteeEmail: UserEmail,
    public readonly cancelledBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}