// apps/web/src/domains/user-management/repositories/interfaces/organization-context.repository.interface.ts

import { OrganizationContextAggregate } from '../../aggregates/organization-context.aggregate';
import { UserId } from '../../value-objects/ids.vo';

export interface OrganizationContextRepository {
  save(context: OrganizationContextAggregate): Promise<void>;
  findByUserId(userId: UserId): Promise<OrganizationContextAggregate | null>;
  deleteByUserId(userId: UserId): Promise<void>;
}

