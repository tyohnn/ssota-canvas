// apps/web/src/domains/workspace-management/backend/services/interfaces/workspace-query.service.interface.ts

import type { Result } from '@/utils/result';
import type { WorkspaceManagementError } from '../../../shared/errors/workspace-management.error';
import type { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import type { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';

/**
 * Workspace Query Service Interface
 *
 * 다른 도메인에서 Workspace 정보를 조회할 때 사용하는 공개 API
 * Repository를 직접 노출하지 않고 Service를 통해 도메인 경계 유지
 */
export interface WorkspaceQueryService {
  /**
   * Workspace 이름 조회
   * @param workspaceId - Workspace ID
   * @returns Workspace 이름
   */
  getWorkspaceName(
    workspaceId: WorkspaceId
  ): Promise<Result<string, WorkspaceManagementError>>;

  /**
   * Workspace 기본 정보 조회
   * @param workspaceId - Workspace ID
   * @returns Workspace 기본 정보 (id, name, description, icon, isDefault)
   */
  getWorkspaceBasicInfo(workspaceId: WorkspaceId): Promise<
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
  >;

  /**
   * 조직의 Workspace 목록 조회 (이름만)
   * @param organizationId - 조직 ID
   * @returns Workspace 목록 (id, name, isDefault)
   */
  getOrganizationWorkspaces(organizationId: OrganizationId): Promise<
    Result<
      Array<{
        id: string;
        name: string;
        isDefault: boolean;
      }>,
      WorkspaceManagementError
    >
  >;

  /**
   * Workspace 멤버 여부 확인
   * @param workspaceId - Workspace ID
   * @param userId - 사용자 ID
   * @returns 멤버 여부
   */
  isMember(
    workspaceId: WorkspaceId,
    userId: string
  ): Promise<Result<boolean, WorkspaceManagementError>>;

  /**
   * Page가 속한 Workspace 정보 조회
   * @param pageId - Page ID
   * @returns Workspace 정보
   */
  getWorkspaceByPageId(pageId: string): Promise<
    Result<
      {
        workspaceId: string;
        workspaceName: string;
        organizationId: string;
      },
      WorkspaceManagementError
    >
  >;
}
