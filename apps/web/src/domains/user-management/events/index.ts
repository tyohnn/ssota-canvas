// apps/web/src/domains/user-management/events/index.ts

import { OrganizationId, UserId } from '../value-objects/ids.vo';
import { UserEmail } from '../value-objects/user-email.vo';

export class UserProfileCreatedEvent {
  readonly type = 'UserProfileCreated';

  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class UserUpdatedEvent {
  readonly type = 'UserUpdated';

  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class DefaultOrganizationCreatedEvent {
  readonly type = 'DefaultOrganizationCreated';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly ownerId: UserId,
    public readonly name: string,
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

export class OrganizationContextSelectedEvent {
  readonly type = 'OrganizationContextSelected';

  constructor(
    public readonly userId: UserId,
    public readonly organizationId: OrganizationId,
    public readonly selectedAt: Date,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationContextUpdatedEvent {
  readonly type = 'OrganizationContextUpdated';

  constructor(
    public readonly contextId: string,
    public readonly organizationId: OrganizationId,
    public readonly selectedAt: Date,
    public readonly timestamp: Date = new Date()
  ) {}
}

export interface OrganizationSummary {
  id: OrganizationId;
  name: string;
  isDefault: boolean;
  createdAt: Date;
}
