// apps/web/src/domains/organization-management/backend/repositories/interfaces/organization.repository.interface.ts

import { OrganizationAggregate } from '../../../shared/aggregates/organization.aggregate';
import { OrganizationId, UserId } from '../../../shared/value-objects/ids.vo';

export interface OrganizationRepository {
  /**
   * 조직 조회 (ID 기반)
   *
   * @param id - 조직 ID
   * @param useAdmin - true면 Admin DB 사용 (Application 레벨 권한 검증 완료 후), false면 RLS 사용 (Owner 체크)
   * @returns 조직 Aggregate 또는 null
   */
  findById(
    id: OrganizationId,
    useAdmin?: boolean
  ): Promise<OrganizationAggregate | null>;
  findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
  save(organization: OrganizationAggregate): Promise<void>;
  delete(id: OrganizationId): Promise<void>;
}
