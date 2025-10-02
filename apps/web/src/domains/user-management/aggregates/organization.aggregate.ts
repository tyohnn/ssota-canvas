// apps/web/src/domains/user-management/aggregates/organization.aggregate.ts

import { Organization } from '../entities/organization.entity';
import { OrganizationId, UserId } from '../value-objects/ids.vo';
import {
  DefaultOrganizationCreatedEvent,
  OrganizationUpdatedEvent,
} from '../events';

export class OrganizationAggregate {
  constructor(private organization: Organization) {}

  // Command 처리
  static createDefault(name: string, ownerId: UserId): OrganizationAggregate {
    const organization = new Organization(
      OrganizationId.generate(),
      name,
      ownerId,
      true, // isDefault
      new Date(),
      new Date()
    );
    return new OrganizationAggregate(organization);
  }

  updateName(name: string): OrganizationUpdatedEvent {
    this.organization.updateName(name);
    return new OrganizationUpdatedEvent(
      this.organization.id,
      this.organization.name
    );
  }

  // Getters
  get id(): OrganizationId {
    return this.organization.id;
  }

  get entity(): Organization {
    return this.organization;
  }

  get ownerId(): UserId {
    return this.organization.ownerId;
  }

  get isDefault(): boolean {
    return this.organization.isDefault;
  }
}
