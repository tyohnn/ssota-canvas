import { WorkspaceAggregate } from '../../../shared/aggregates/workspace.aggregate';
import { Workspace } from '../../../shared/entities/workspace.entity';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';

/**
 * Workspace Repository Interface
 *
 * Workspace Aggregate의 영속성을 담당하는 Repository 계약
 */
export interface WorkspaceRepository {
  /**
   * Workspace 저장 (생성 또는 업데이트)
   *
   * @param aggregate - Workspace Aggregate
   */
  save(aggregate: WorkspaceAggregate): Promise<void>;

  /**
   * ID로 Workspace 조회
   *
   * @param id - Workspace ID
   * @returns Workspace Entity 또는 null
   */
  findById(id: WorkspaceId): Promise<Workspace | null>;

  /**
   * 조직의 모든 Workspace 조회 (Default 우선 정렬)
   *
   * ⚠️ 주의: Service Layer에서 조직 멤버십 확인 후에만 호출!
   *
   * @param organizationId - 조직 ID
   * @returns Workspace Entity 배열
   */
  findByOrganizationId(organizationId: OrganizationId): Promise<Workspace[]>;
}
