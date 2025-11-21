// apps/web/src/domains/workspace-management/backend/services/workspace-query.service.ts

import type { WorkspaceRepository } from '../repositories/interfaces/workspace.repository.interface';
import type { WorkspaceMemberRepository } from '../repositories/interfaces/workspace-member.repository.interface';
import type { PageRepository } from '../repositories/interfaces/page.repository.interface';
import { WorkspaceManagementError } from '../../shared/errors/workspace-management.error';
import { Result } from '@/utils/result';
import type { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';
import type { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import type { WorkspaceQueryService } from './interfaces/workspace-query.service.interface';
import { PageId } from '../../shared/value-objects/page-id.vo';

/**
 * Workspace Query Service Implementation
 *
 * 다른 도메인에서 Workspace 정보를 조회할 때 사용하는 공개 API
 * Repository를 직접 노출하지 않고 Service를 통해 도메인 경계 유지
 */
export class DefaultWorkspaceQueryService implements WorkspaceQueryService {
  constructor(
    private workspaceRepository: WorkspaceRepository,
    private workspaceMemberRepository: WorkspaceMemberRepository,
    private pageRepository: PageRepository
  ) {}

  /**
   * Workspace 이름 조회
   */
  async getWorkspaceName(
    workspaceId: WorkspaceId
  ): Promise<Result<string, WorkspaceManagementError>> {
    try {
      const workspace = await this.workspaceRepository.findById(workspaceId);

      if (!workspace) {
        return Result.error(
          new WorkspaceManagementError(
            'WORKSPACE_NOT_FOUND',
            'Workspace not found'
          )
        );
      }

      return Result.success(workspace.name);
    } catch (error) {
      return Result.error(
        new WorkspaceManagementError(
          'WORKSPACE_RETRIEVAL_FAILED',
          'Failed to get workspace name',
          { error }
        )
      );
    }
  }

  /**
   * Workspace 기본 정보 조회
   */
  async getWorkspaceBasicInfo(workspaceId: WorkspaceId): Promise<
    Result<
      {
        id: string;
        name: string;
        description: string | null;
        icon: string | null;
        isDefault: boolean;
        organizationId: string;
      },
      WorkspaceManagementError
    >
  > {
    try {
      const workspace = await this.workspaceRepository.findById(workspaceId);

      if (!workspace) {
        return Result.error(
          new WorkspaceManagementError(
            'WORKSPACE_NOT_FOUND',
            'Workspace not found'
          )
        );
      }

      return Result.success({
        id: workspace.workspaceId.value,
        name: workspace.name,
        description: workspace.description,
        icon: workspace.icon,
        isDefault: workspace.isDefault,
        organizationId: workspace.organizationId.value,
      });
    } catch (error) {
      return Result.error(
        new WorkspaceManagementError(
          'WORKSPACE_RETRIEVAL_FAILED',
          'Failed to get workspace info',
          { error }
        )
      );
    }
  }

  /**
   * 조직의 Workspace 목록 조회 (이름만)
   */
  async getOrganizationWorkspaces(organizationId: OrganizationId): Promise<
    Result<
      Array<{
        id: string;
        name: string;
        isDefault: boolean;
      }>,
      WorkspaceManagementError
    >
  > {
    try {
      const workspaces =
        await this.workspaceRepository.findByOrganizationId(organizationId);

      const workspaceList = workspaces.map(ws => ({
        id: ws.workspaceId.value,
        name: ws.name,
        isDefault: ws.isDefault,
      }));

      return Result.success(workspaceList);
    } catch (error) {
      return Result.error(
        new WorkspaceManagementError(
          'WORKSPACE_RETRIEVAL_FAILED',
          'Failed to get organization workspaces',
          { error }
        )
      );
    }
  }

  /**
   * Workspace 멤버 여부 확인
   */
  async isMember(
    workspaceId: WorkspaceId,
    userId: string
  ): Promise<Result<boolean, WorkspaceManagementError>> {
    try {
      const isMember = await this.workspaceMemberRepository.isMember(
        workspaceId,
        userId
      );
      return Result.success(isMember);
    } catch (error) {
      return Result.error(
        new WorkspaceManagementError(
          'WORKSPACE_RETRIEVAL_FAILED',
          'Failed to check workspace membership',
          { error }
        )
      );
    }
  }

  /**
   * Page가 속한 Workspace 정보 조회
   */
  async getWorkspaceByPageId(pageId: string): Promise<
    Result<
      {
        workspaceId: string;
        workspaceName: string;
        organizationId: string;
      },
      WorkspaceManagementError
    >
  > {
    try {
      const page = await this.pageRepository.findById(new PageId(pageId));

      if (!page) {
        return Result.error(
          new WorkspaceManagementError('PAGE_NOT_FOUND', 'Page not found')
        );
      }

      const workspace = await this.workspaceRepository.findById(
        page.workspaceId
      );

      if (!workspace) {
        return Result.error(
          new WorkspaceManagementError(
            'WORKSPACE_NOT_FOUND',
            'Workspace not found'
          )
        );
      }

      return Result.success({
        workspaceId: workspace.workspaceId.value,
        workspaceName: workspace.name,
        organizationId: workspace.organizationId.value,
      });
    } catch (error) {
      return Result.error(
        new WorkspaceManagementError(
          'WORKSPACE_RETRIEVAL_FAILED',
          'Failed to get workspace by page id',
          { error }
        )
      );
    }
  }
}
