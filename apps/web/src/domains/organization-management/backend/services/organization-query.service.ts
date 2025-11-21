// apps/web/src/domains/organization-management/backend/services/organization-query.service.ts

import type { OrganizationRepository } from '../repositories/interfaces/organization.repository.interface';
import type { OrganizationMemberRepository } from '../repositories/interfaces/organization-member.repository.interface';
import { OrganizationManagementError } from '../../shared/errors/organization-management.error';
import { Result } from '@/utils/result';
import type { MemberRole } from '../../shared/value-objects/member-role.vo';
import type { OrganizationId, UserId } from '../../shared/value-objects/ids.vo';
import type { OrganizationQueryService } from './interfaces/organization-query.service.interface';

/**
 * Organization Query Service Implementation
 *
 * 다른 도메인에서 Organization 정보를 조회할 때 사용하는 공개 API
 * Repository를 직접 노출하지 않고 Service를 통해 도메인 경계 유지
 */
export class DefaultOrganizationQueryService
  implements OrganizationQueryService
{
  constructor(
    private organizationRepository: OrganizationRepository,
    private organizationMemberRepository: OrganizationMemberRepository
  ) {}

  /**
   * 조직 멤버 여부 확인
   */
  async isMember(
    organizationId: OrganizationId,
    userId: UserId
  ): Promise<Result<boolean, OrganizationManagementError>> {
    try {
      const isMember = await this.organizationMemberRepository.isMember(
        organizationId,
        userId
      );
      return Result.success(isMember);
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'ORGANIZATION_RETRIEVAL_FAILED',
          'Failed to check organization membership',
          { error }
        )
      );
    }
  }

  /**
   * 조직 멤버의 역할 조회
   */
  async getMemberRole(
    organizationId: OrganizationId,
    userId: UserId
  ): Promise<Result<MemberRole | null, OrganizationManagementError>> {
    try {
      const role = await this.organizationMemberRepository.findMemberRole(
        organizationId,
        userId
      );
      return Result.success(role);
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'ORGANIZATION_RETRIEVAL_FAILED',
          'Failed to get member role',
          { error }
        )
      );
    }
  }

  /**
   * 조직 이름 조회
   */
  async getOrganizationName(
    organizationId: OrganizationId
  ): Promise<Result<string, OrganizationManagementError>> {
    try {
      const name =
        await this.organizationRepository.getOrganizationName(organizationId);

      if (!name) {
        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_NOT_FOUND',
            'Organization not found'
          )
        );
      }

      return Result.success(name);
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'ORGANIZATION_RETRIEVAL_FAILED',
          'Failed to get organization name',
          { error }
        )
      );
    }
  }

  /**
   * 이메일로 사용자 프로필 검색
   */
  async searchUserByEmail(email: string): Promise<
    Result<
      Array<{
        userId: string;
        email: string;
        name: string | null;
        profileImageUrl: string | null;
      }>,
      OrganizationManagementError
    >
  > {
    try {
      const profiles =
        await this.organizationMemberRepository.searchUserProfileByEmail(email);

      // undefined를 null로 변환하여 타입 일치
      const normalizedProfiles = profiles.map(profile => ({
        userId: profile.userId,
        email: profile.email,
        name: profile.name,
        profileImageUrl: profile.profileImageUrl ?? null,
      }));

      return Result.success(normalizedProfiles);
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'ORGANIZATION_RETRIEVAL_FAILED',
          'Failed to search user by email',
          { error }
        )
      );
    }
  }
}
