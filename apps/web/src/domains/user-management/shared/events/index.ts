// apps/web/src/domains/user-management/events/index.ts

import { OrganizationId, UserId } from '../value-objects/ids.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import { OrganizationType } from '../types';

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
