// apps/web/src/domains/user-management/repositories/interfaces/organization.repository.interface.ts

import { OrganizationAggregate } from '../../aggregates/organization.aggregate';
import { OrganizationId, UserId } from '../../value-objects/ids.vo';

export interface OrganizationRepository {
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
  save(organization: OrganizationAggregate): Promise<void>;
  delete(id: OrganizationId): Promise<void>;
}
