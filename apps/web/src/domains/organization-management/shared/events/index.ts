// apps/web/src/domains/organization-management/shared/events/index.ts

import {
  OrganizationId,
  UserId,
  InvitationId,
  NotificationId,
} from '../value-objects/ids.vo';
import { OrganizationType, InvitationStatus } from '../types';
import { MemberRole } from '../value-objects/member-role.vo';

export class DefaultOrganizationCreatedEvent {
  readonly type = 'DefaultOrganizationCreated';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly ownerId: UserId,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class NewOrganizationCreatedEvent {
  readonly type = 'NewOrganizationCreated';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly name: string,
    public readonly organizationType: OrganizationType,
    public readonly ownerId: UserId,
    public readonly isDefault: boolean,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationUpdatedEvent {
  readonly type = 'OrganizationUpdated';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MemberInvitationRequestedEvent {
  readonly type = 'MemberInvitationRequested';

  constructor(
    public readonly invitationId: InvitationId,
    public readonly organizationId: OrganizationId,
    public readonly inviterUserId: UserId,
    public readonly inviteeEmail: string,
    public readonly role: MemberRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class InvitationAcceptedEvent {
  readonly type = 'InvitationAccepted';

  constructor(
    public readonly invitationId: InvitationId,
    public readonly organizationId: OrganizationId,
    public readonly inviteeUserId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class InvitationRejectedEvent {
  readonly type = 'InvitationRejected';

  constructor(
    public readonly invitationId: InvitationId,
    public readonly inviteeUserId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class InvitationNotificationCreatedEvent {
  readonly type = 'InvitationNotificationCreated';

  constructor(
    public readonly notificationId: NotificationId,
    public readonly userId: UserId,
    public readonly invitationId: InvitationId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class NotificationReadEvent {
  readonly type = 'NotificationRead';

  constructor(
    public readonly notificationId: NotificationId,
    public readonly userId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class NewMemberAddedToOrganizationEvent {
  readonly type = 'NewMemberAddedToOrganization';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly role: MemberRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MemberRoleChangedEvent {
  readonly type = 'MemberRoleChanged';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly oldRole: MemberRole,
    public readonly newRole: MemberRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MemberRemovedFromOrganizationEvent {
  readonly type = 'MemberRemovedFromOrganization';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationOwnershipTransferredEvent {
  readonly type = 'OrganizationOwnershipTransferred';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly oldOwnerId: UserId,
    public readonly newOwnerId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationDeletedEvent {
  readonly type = 'OrganizationDeleted';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly timestamp: Date = new Date()
  ) {}
}
