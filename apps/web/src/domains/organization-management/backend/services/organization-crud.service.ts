// apps/web/src/domains/organization-management/backend/services/organization-crud.service.ts

import type { OrganizationRepository } from '../repositories/interfaces/organization.repository.interface';
import type { OrganizationMemberRepository } from '../repositories/interfaces/organization-member.repository.interface';
import { OrganizationAggregate } from '../../shared/aggregates/organization.aggregate';
import { UserId, OrganizationId } from '../../shared/value-objects/ids.vo';
import { MemberRole } from '../../shared/value-objects/member-role.vo';
import { OrganizationManagementError } from '../../shared/errors/organization-management.error';
import { Result } from '@/utils/result';
import type {
  CreateDefaultOrganizationCommand,
  CreateOrganizationCommand,
  GetUserOrganizationsCommand,
} from '../../shared/commands';
import type { OrganizationSummary } from '../../shared/dtos';
import type { WorkspaceCrudService } from '@/domains/workspace-management/backend/services/interfaces/workspace-crud.service.interface';
import type { OrganizationCrudService } from './interfaces/organization-crud.service.interface';
import type {
  CreateDefaultOrganizationResult,
  CreateOrganizationWithWorkspaceResult,
} from './interfaces/common.types';

/**
 * Organization CRUD Service Implementation
 *
 * 조직 생성, 조회를 담당
 */
export class DefaultOrganizationCrudService implements OrganizationCrudService {
  constructor(
    private organizationRepository: OrganizationRepository,
    private organizationMemberRepository: OrganizationMemberRepository,
    private workspaceCrudService: WorkspaceCrudService
  ) {}

  /**
   * 기본 조직 생성 (is_default=true)
   * - 사용자 가입 시 자동 호출
   * - Default Workspace + Welcome 페이지 자동 생성
   * - 생성 완료 후 리다이렉션 URL 반환
   */
  async createDefaultOrganization(
    command: CreateDefaultOrganizationCommand
  ): Promise<
    Result<CreateDefaultOrganizationResult, OrganizationManagementError>
  > {
    try {
      const userId = new UserId(command.userId);

      // 1. 중복 기본 조직 확인
      const existingOrganizations =
        await this.organizationRepository.findByOwnerId(userId);
      const existingDefaultOrg = existingOrganizations.find(
        org => org.entity.isDefault
      );

      if (existingDefaultOrg) {
        return Result.error(
          new OrganizationManagementError(
            'DEFAULT_ORGANIZATION_ALREADY_EXISTS',
            'Default organization already exists for this user',
            { existingOrganizationId: existingDefaultOrg.id.value }
          )
        );
      }

      // 2. 기본 조직 생성
      const organization = OrganizationAggregate.createDefault(
        command.organizationName,
        userId
      );

      // 3. 조직 저장
      await this.organizationRepository.save(organization);

      // 4. 소유자를 organization_members 테이블에 추가
      await this.organizationMemberRepository.addMember({
        organizationId: organization.id,
        userId: userId,
        role: new MemberRole('owner'),
        joinedAt: new Date(),
      });

      // 5. 소유자 프로필 조회 (개인 워크스페이스 이름 생성용)
      const ownerProfiles =
        await this.organizationMemberRepository.searchUserProfileByEmail('');
      const ownerProfile = ownerProfiles.find(
        profile => profile.userId === command.userId
      );
      const ownerName = ownerProfile?.name || 'User';

      // 6. Default Workspace + Welcome 페이지 생성 (Workspace Management Domain 통합)
      const workspaceResult =
        await this.workspaceCrudService.createDefaultWorkspace(
          organization.id,
          command.userId
        );

      if (!workspaceResult.success) {
        // 워크스페이스 생성 실패 시 조직 전체 롤백
        await this.rollbackOrganizationCreation(organization.id, userId);

        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_CREATION_FAILED',
            `Failed to create default workspace: ${workspaceResult.error}`
          )
        );
      }

      const {
        workspaceId,
        workspaceName,
        workspaceIsDefault,
        firstPageId,
        firstPageTitle,
        firstPageIcon,
      } = workspaceResult.data;

      // 7. 개인 워크스페이스 생성 (v1.2)
      const personalWorkspaceResult =
        await this.workspaceCrudService.createPersonalWorkspace(
          organization.id,
          command.userId,
          ownerName
        );

      if (!personalWorkspaceResult.success) {
        // 개인 워크스페이스 생성 실패 시 조직 전체 롤백
        await this.rollbackOrganizationCreation(organization.id, userId);

        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_CREATION_FAILED',
            `Failed to create personal workspace: ${personalWorkspaceResult.error}`
          )
        );
      }

      const {
        workspaceId: personalWorkspaceId,
        workspaceName: personalWorkspaceName,
        workspaceIsDefault: personalWorkspaceIsDefault,
        firstPageId: personalPageId,
        firstPageTitle: personalPageTitle,
        firstPageIcon: personalPageIcon,
      } = personalWorkspaceResult.data;

      // 8. 리다이렉션 URL 생성
      const redirectUrl = `/r/${organization.id.value}/${firstPageId}`;

      // 9. 결과 반환 (SSOT: workspace service에서 반환된 실제 값 사용)
      return Result.success({
        organization: {
          id: organization.id.value,
          name: organization.entity.name,
          organizationType: organization.entity.organizationType,
          isDefault: true,
          role: 'owner',
          createdAt: organization.entity.createdAt.toISOString(),
        },
        workspace: {
          id: workspaceId,
          name: workspaceName,
          isDefault: workspaceIsDefault,
        },
        page: {
          id: firstPageId,
          title: firstPageTitle,
          icon: firstPageIcon,
        },
        personalWorkspace: {
          id: personalWorkspaceId,
          name: personalWorkspaceName,
          isDefault: personalWorkspaceIsDefault,
        },
        personalPage: {
          id: personalPageId,
          title: personalPageTitle,
          icon: personalPageIcon,
        },
        redirectUrl,
      });
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'ORGANIZATION_CREATION_FAILED',
          'Failed to create default organization with workspace and page',
          { error }
        )
      );
    }
  }

  /**
   * 일반 조직 생성 (is_default=false)
   * - 사용자가 수동으로 생성
   * - Default Workspace + Untitled 페이지 자동 생성
   */
  async createOrganization(
    command: CreateOrganizationCommand
  ): Promise<
    Result<CreateOrganizationWithWorkspaceResult, OrganizationManagementError>
  > {
    try {
      // 1. 조직 이름 중복 검사
      const ownerId = new UserId(command.ownerId);
      const existingOrganizations =
        await this.organizationRepository.findByOwnerId(ownerId);

      const duplicateOrg = existingOrganizations.find(
        org => org.entity.name.toLowerCase() === command.name.toLowerCase()
      );

      if (duplicateOrg) {
        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_NAME_DUPLICATE',
            'Organization with this name already exists'
          )
        );
      }

      // 2. 새로운 조직 생성
      const newOrganization = OrganizationAggregate.createNew(
        command.name,
        command.organizationType,
        ownerId
      );

      // 3. 조직 저장
      await this.organizationRepository.save(newOrganization);

      // 4. 소유자를 organization_members 테이블에 추가
      await this.organizationMemberRepository.addMember({
        organizationId: newOrganization.id,
        userId: ownerId,
        role: new MemberRole('owner'),
        joinedAt: new Date(),
      });

      // 5. 소유자 프로필 조회 (개인 워크스페이스 이름 생성용)
      const ownerProfiles =
        await this.organizationMemberRepository.searchUserProfileByEmail('');
      const ownerProfile = ownerProfiles.find(
        profile => profile.userId === command.ownerId
      );
      const ownerName = ownerProfile?.name || 'User';

      // 6. Default Workspace + Untitled 페이지 생성 (Workspace Management Domain 통합)
      const workspaceResult = await this.workspaceCrudService.createWorkspace(
        newOrganization.id,
        'Default Workspace',
        null, // description
        null, // icon
        command.ownerId
      );

      if (!workspaceResult.success) {
        // 워크스페이스 생성 실패 시 조직 전체 롤백
        await this.rollbackOrganizationCreation(newOrganization.id, ownerId);

        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_CREATION_FAILED',
            `Failed to create default workspace: ${workspaceResult.error}`
          )
        );
      }

      const {
        workspaceId,
        workspaceName,
        workspaceIsDefault,
        firstPageId,
        firstPageTitle,
        firstPageIcon,
      } = workspaceResult.data;

      // 7. 개인 워크스페이스 생성 (v1.2)
      const personalWorkspaceResult =
        await this.workspaceCrudService.createPersonalWorkspace(
          newOrganization.id,
          command.ownerId,
          ownerName
        );

      if (!personalWorkspaceResult.success) {
        // 개인 워크스페이스 생성 실패 시 조직 전체 롤백
        await this.rollbackOrganizationCreation(newOrganization.id, ownerId);

        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_CREATION_FAILED',
            `Failed to create personal workspace: ${personalWorkspaceResult.error}`
          )
        );
      }

      const {
        workspaceId: personalWorkspaceId,
        workspaceName: personalWorkspaceName,
        workspaceIsDefault: personalWorkspaceIsDefault,
        firstPageId: personalPageId,
        firstPageTitle: personalPageTitle,
        firstPageIcon: personalPageIcon,
      } = personalWorkspaceResult.data;

      // 8. 결과 반환 (SSOT: workspace service에서 반환된 실제 값 사용)
      return Result.success({
        organization: {
          id: newOrganization.id.value,
          name: newOrganization.entity.name,
          organizationType: newOrganization.entity.organizationType,
          isDefault: newOrganization.entity.isDefault,
          role: 'owner',
          createdAt: newOrganization.entity.createdAt.toISOString(),
        },
        workspace: {
          id: workspaceId,
          name: workspaceName,
          isDefault: workspaceIsDefault,
        },
        page: {
          id: firstPageId,
          title: firstPageTitle,
          icon: firstPageIcon,
        },
        personalWorkspace: {
          id: personalWorkspaceId,
          name: personalWorkspaceName,
          isDefault: personalWorkspaceIsDefault,
        },
        personalPage: {
          id: personalPageId,
          title: personalPageTitle,
          icon: personalPageIcon,
        },
      });
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'ORGANIZATION_CREATION_FAILED',
          'Failed to create organization with workspace and page',
          { error }
        )
      );
    }
  }

  /**
   * 사용자의 조직 목록 조회
   * - 소유자인 조직 + 멤버로 속한 조직
   * - 소유자 조직 우선, 그 다음 참여일 순 정렬
   */
  async getUserOrganizations(
    command: GetUserOrganizationsCommand
  ): Promise<Result<OrganizationSummary[], OrganizationManagementError>> {
    try {
      const userId = new UserId(command.userId);

      // Map을 사용하여 조직 정보와 참여일 함께 관리
      const organizationData = new Map<
        string,
        { summary: OrganizationSummary; sortKey: Date }
      >();

      // 1. 소유자인 조직 조회
      const ownedOrganizations =
        await this.organizationRepository.findByOwnerId(userId);

      for (const org of ownedOrganizations) {
        organizationData.set(org.id.value, {
          summary: {
            id: org.id.value,
            name: org.entity.name,
            organizationType: org.entity.organizationType,
            isDefault: org.entity.isDefault,
            role: 'owner',
            createdAt: org.entity.createdAt.toISOString(),
          },
          sortKey: org.entity.createdAt, // 소유자 조직은 생성일로 정렬
        });
      }

      // 2. 멤버로 속한 조직 조회
      const memberInfos =
        await this.organizationMemberRepository.findByUserId(userId);

      for (const memberInfo of memberInfos) {
        // 이미 소유자로 추가된 조직은 건너뜀 (중복 방지)
        if (organizationData.has(memberInfo.organizationId.value)) {
          continue;
        }

        // 조직 상세 정보 조회 (Admin DB 사용 - 멤버십 확인 완료)
        const org = await this.organizationRepository.findByIdAsAdmin(
          memberInfo.organizationId
        );

        if (org) {
          organizationData.set(org.id.value, {
            summary: {
              id: org.id.value,
              name: org.entity.name,
              organizationType: org.entity.organizationType,
              isDefault: org.entity.isDefault,
              role: memberInfo.role.value as 'owner' | 'admin' | 'member',
              createdAt: org.entity.createdAt.toISOString(),
            },
            sortKey: memberInfo.joinedAt, // 멤버 조직은 참여일로 정렬
          });
        }
      }

      // 3. 정렬: 소유자 조직 먼저, 그 다음 참여일 오름차순
      const sortedOrganizations = Array.from(organizationData.values())
        .sort((a, b) => {
          // 소유자 조직 우선
          if (a.summary.role === 'owner' && b.summary.role !== 'owner') {
            return -1;
          }
          if (a.summary.role !== 'owner' && b.summary.role === 'owner') {
            return 1;
          }
          // 같은 타입이면 날짜 순서
          return a.sortKey.getTime() - b.sortKey.getTime();
        })
        .map(item => item.summary);

      return Result.success(sortedOrganizations);
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'ORGANIZATION_RETRIEVAL_FAILED',
          'Failed to get user organizations',
          { error }
        )
      );
    }
  }

  /**
   * 조직 생성 롤백 - 실패 시 생성된 모든 관련 데이터 정리
   * @private
   */
  private async rollbackOrganizationCreation(
    organizationId: OrganizationId,
    userId: UserId
  ): Promise<void> {
    try {
      console.warn(
        '[OrganizationCrudService] Starting rollback for organization:',
        organizationId.value
      );

      // 1. 조직 멤버 제거 (먼저 FK 관계 정리)
      try {
        await this.organizationMemberRepository.removeMember(
          organizationId,
          userId
        );
        console.log(
          '[OrganizationCrudService] Removed organization member during rollback'
        );
      } catch (error) {
        console.error(
          '[OrganizationCrudService] Failed to remove organization member during rollback:',
          error
        );
        // 멤버 제거 실패는 조직 삭제를 막지 않음 (orphan 방지)
      }

      // 2. 조직 삭제
      try {
        await this.organizationRepository.delete(organizationId);
        console.log(
          '[OrganizationCrudService] Deleted organization during rollback'
        );
      } catch (error) {
        console.error(
          '[OrganizationCrudService] Failed to delete organization during rollback:',
          error
        );
        throw error; // 조직 삭제 실패는 심각한 문제
      }

      console.log('[OrganizationCrudService] Rollback completed successfully');
    } catch (error) {
      console.error('[OrganizationCrudService] Rollback failed:', error);
      // 롤백 실패도 원래 에러에 포함하지 않음 (원인 파악을 위해)
      // 대신 별도 로깅으로 관리자가 확인할 수 있도록 함
    }
  }
}
