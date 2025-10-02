// apps/web/src/domains/user-management/aggregates/organization-context.aggregate.ts

import { OrganizationContext } from '../entities/organization-context.entity';
import { UserId, OrganizationId } from '../value-objects/ids.vo';
import {
  OrganizationContextSelectedEvent,
  OrganizationContextUpdatedEvent,
} from '../events';

export class OrganizationContextAggregate {
  constructor(private context: OrganizationContext) {}

  // Command 처리
  static create(
    userId: UserId,
    selectedOrganizationId: OrganizationId
  ): OrganizationContextAggregate {
    const context = new OrganizationContext(
      `ctx_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`,
      userId,
      selectedOrganizationId,
      new Date(), // selectedAt
      new Date(), // createdAt
      new Date() // updatedAt
    );
    return new OrganizationContextAggregate(context);
  }

  selectOrganization(
    organizationId: OrganizationId
  ): OrganizationContextSelectedEvent {
    this.context.updateSelectedOrganization(organizationId);
    return new OrganizationContextSelectedEvent(
      this.context.userId,
      organizationId,
      this.context.selectedAt
    );
  }

  updateContext(
    organizationId: OrganizationId
  ): OrganizationContextUpdatedEvent {
    this.context.updateSelectedOrganization(organizationId);
    return new OrganizationContextUpdatedEvent(
      this.context.id,
      organizationId,
      this.context.selectedAt
    );
  }

  // Getters
  get id(): string {
    return this.context.id;
  }

  get entity(): OrganizationContext {
    return this.context;
  }

  get userId(): UserId {
    return this.context.userId;
  }

  get selectedOrganizationId(): OrganizationId {
    return this.context.selectedOrganizationId;
  }

  get isActive(): boolean {
    return this.context.isActive;
  }
}
