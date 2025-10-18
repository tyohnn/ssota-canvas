// apps/web/src/domains/organization-management/backend/services/interfaces/organization-query.service.interface.ts

import type { Result } from '@/utils/result';
import type { OrganizationManagementError } from '../../../shared/errors/organization-management.error';
import type { MemberRole } from '../../../shared/value-objects/member-role.vo';
import type {
  OrganizationId,
  UserId,
} from '../../../shared/value-objects/ids.vo';

/**
 * Organization Query Service Interface
 *
 * 다른 도메인에서 Organization 정보를 조회할 때 사용하는 공개 API
 * Repository를 직접 노출하지 않고 Service를 통해 도메인 경계 유지
 */
export interface OrganizationQueryService {
  /**
   * 조직 멤버 여부 확인
   * @param organizationId - 조직 ID
   * @param userId - 사용자 ID
   * @returns 멤버 여부
   */
  isMember(
    organizationId: OrganizationId,
    userId: UserId
  ): Promise<Result<boolean, OrganizationManagementError>>;

  /**
   * 조직 멤버의 역할 조회
   * @param organizationId - 조직 ID
   * @param userId - 사용자 ID
   * @returns 역할 (owner, admin, member) 또는 null (멤버 아님)
   */
  getMemberRole(
    organizationId: OrganizationId,
    userId: UserId
  ): Promise<Result<MemberRole | null, OrganizationManagementError>>;

  /**
   * 조직 이름 조회
   * @param organizationId - 조직 ID
   * @returns 조직 이름
   */
  getOrganizationName(
    organizationId: OrganizationId
  ): Promise<Result<string, OrganizationManagementError>>;

  /**
   * 이메일로 사용자 프로필 검색
   * @param email - 이메일
   * @returns 사용자 프로필 배열
   */
  searchUserByEmail(email: string): Promise<
    Result<
      Array<{
        userId: string;
        email: string;
        name: string | null;
        profileImageUrl: string | null;
      }>,
      OrganizationManagementError
    >
  >;
}
