// apps/web/src/domains/organization-management/shared/events/index.ts

import type { DomainEvent } from '@/domains/canvas-management/shared/events/domain-event';
import type { InvitationAcceptedPolicyContext } from '../contexts/invitation-accepted-policy.context';
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

export class InvitationAcceptedEvent implements DomainEvent {
  readonly type = 'InvitationAccepted';

  constructor(
    public readonly invitationId: InvitationId,
    public readonly organizationId: OrganizationId,
    public readonly inviteeUserId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}

  get aggregateId(): InvitationId {
    return this.invitationId;
  }

  get data() {
    return {
      organizationId: this.organizationId,
      inviteeUserId: this.inviteeUserId,
      timestamp: this.timestamp,
    };
  }

  /**
   * Policy: When InvitationAccepted → add member to default workspace.
   */
  private async applyAddToDefaultWorkspacePolicy(
    context?: unknown
  ): Promise<void> {
    const ctx = context as InvitationAcceptedPolicyContext | undefined;
    if (!ctx?.workspaceCrudService) return;
    await ctx.workspaceCrudService
      .addMemberToDefaultWorkspace(
        this.organizationId,
        this.inviteeUserId.value
      )
      .catch(() => {});
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyAddToDefaultWorkspacePolicy(context)]);
  }
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

export class MemberPromotedToAdminEvent {
  readonly type = 'MemberPromotedToAdmin';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly targetUserId: UserId,
    public readonly promotedBy: UserId,
    public readonly newRole: 'admin' | 'member',
    public readonly timestamp: Date = new Date()
  ) {}
}

export class AdminDemotedToMemberEvent {
  readonly type = 'AdminDemotedToMember';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly targetUserId: UserId,
    public readonly demotedBy: UserId,
    public readonly newRole: 'admin' | 'member',
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
