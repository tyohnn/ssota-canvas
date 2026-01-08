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

import { organizations, workspaces, workspaceMembers } from '@/db/schema';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { adminDb } from '@/db';

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
   * 사용자가 참여 중인 모든 Workspace 목록 조회
   */
  async getWorkspacesForUser(userId: string): Promise<
    Result<
      Array<{
        id: string;
        name: string;
        icon?: string;
        organizationName?: string;
      }>,
      WorkspaceManagementError
    >
  > {
    try {
      const rows = await adminDb
        .select({
          id: workspaces.id,
          name: workspaces.name,
          icon: workspaces.icon,
          organizationName: organizations.name,
          isDefault: workspaces.is_default,
          createdAt: workspaces.created_at,
        })
        .from(workspaces)
        .leftJoin(
          workspaceMembers,
          eq(workspaces.id, workspaceMembers.workspace_id)
        )
        .leftJoin(organizations, eq(workspaces.organization_id, organizations.id))
        .where(
          and(
            isNull(workspaces.deleted_at),
            or(
              eq(workspaceMembers.user_id, userId),
              eq(workspaces.owner_id, userId)
            )
          )
        )
        .orderBy(desc(workspaces.is_default), workspaces.created_at);

      const result = rows.map(row => ({
        id: row.id,
        name: row.name,
        icon: row.icon ?? undefined,
        organizationName: row.organizationName ?? undefined,
      }));

      return Result.success(result);
    } catch (error) {
      return Result.error(
        new WorkspaceManagementError(
          'WORKSPACE_RETRIEVAL_FAILED',
          'Failed to get workspaces for user',
          { error }
        )
      );
    }
  }

  /**
   * 페이지 기본 정보 조회
   */
  async getPageInfo(pageId: string): Promise<
    Result<
      {
        pageId: string;
        title: string;
        icon?: string;
        workspaceId?: string;
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

      return Result.success({
        pageId: page.pageId.value,
        title: page.title,
        icon: page.icon ?? undefined,
        workspaceId: page.workspaceId?.value,
      });
    } catch (error) {
      return Result.error(
        new WorkspaceManagementError(
          'WORKSPACE_RETRIEVAL_FAILED',
          'Failed to get page info',
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
