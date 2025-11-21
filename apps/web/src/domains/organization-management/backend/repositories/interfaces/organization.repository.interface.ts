// apps/web/src/domains/organization-management/backend/repositories/interfaces/organization.repository.interface.ts

import { OrganizationAggregate } from '../../../shared/aggregates/organization.aggregate';
import { OrganizationId, UserId } from '../../../shared/value-objects/ids.vo';

export interface OrganizationRepository {
  /**
   * 조직 조회 (ID 기반) - RLS 적용
   *
   * 🔒 보안: RLS 정책으로 Owner만 조회 가능
   *
   * @param id - 조직 ID
   * @returns 조직 Aggregate 또는 null (Owner가 아니면 null)
   */
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;

  /**
   * 조직 조회 (ID 기반) - Admin DB 사용
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   * 사용 시나리오:
   * - Admin이 멤버 초대 시 (Service에서 Admin 권한 확인 후)
   * - Admin이 역할 변경 시 (Service에서 Admin 권한 확인 후)
   * - 멤버십 확인 후 조직 조회 (getUserOrganizations)
   *
   * @param id - 조직 ID
   * @returns 조직 Aggregate 또는 null
   */
  findByIdAsAdmin(id: OrganizationId): Promise<OrganizationAggregate | null>;

  findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
  save(organization: OrganizationAggregate): Promise<void>;
  delete(id: OrganizationId): Promise<void>;

  /**
   * 조직 이름 조회 (Admin DB 사용)
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   * 사용 시나리오:
   * - 알림 메시지에 조직 이름 포함 시
   * - 간단한 조직 정보 표시 시 (전체 Aggregate 불필요)
   *
   * @param id - 조직 ID
   * @returns 조직 이름 또는 null (조직이 없는 경우)
   */
  getOrganizationName(id: OrganizationId): Promise<string | null>;
}
