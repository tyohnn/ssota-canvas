// apps/web/src/domains/organization-management/shared/aggregates/organization.aggregate.ts

import { Organization } from '../entities/organization.entity';
import { OrganizationId, UserId } from '../value-objects/ids.vo';
import { OrganizationType } from '../types';
import {
  DefaultOrganizationCreatedEvent,
  NewOrganizationCreatedEvent,
  OrganizationUpdatedEvent,
} from '../events';

export class OrganizationAggregate {
  constructor(private organization: Organization) {}

  // Command 처리
  static createDefault(name: string, ownerId: UserId): OrganizationAggregate {
    const organization = new Organization(
      OrganizationId.generate(),
      name,
      'personal', // 기본 조직은 개인 타입
      ownerId,
      true, // isDefault
      new Date(),
      new Date()
    );
    return new OrganizationAggregate(organization);
  }

  static createNew(
    name: string,
    organizationType: OrganizationType,
    ownerId: UserId
  ): OrganizationAggregate {
    const organization = new Organization(
      OrganizationId.generate(),
      name,
      organizationType,
      ownerId,
      false, // isDefault - 새로운 조직은 기본 조직이 아님
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

  transferOwnership(newOwnerId: UserId): void {
    this.organization.transferOwnership(newOwnerId);
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
