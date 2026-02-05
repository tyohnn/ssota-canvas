/**
 * 기존 기본 조직 조회 (서비스 레이어)
 *
 * createDefaultOrganization이 이미 존재할 때 동일한 DTO 형태로 반환.
 * Organization/Workspace/Page 리포지토리만 사용.
 */
import type { CreateDefaultOrganizationResult } from '@/domains/organization-management/backend/services/interfaces/common.types';
import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { UserId } from '../../shared/value-objects/ids.vo';
import { Result } from '@/utils/result';
import {
  UserManagementError,
  type UserManagementErrorCode,
} from '../../shared/errors/user-management.error';

export type GetExistingDefaultOrganizationDeps = {
  organizationRepository: DrizzleOrganizationRepository;
  workspaceRepository: DrizzleWorkspaceRepository;
  pageRepository: DrizzlePageRepository;
};

/**
 * 소유자의 기존 기본 조직 반환 (리다이렉트 URL 등)
 */
export async function getExistingDefaultOrganization(
  userId: string,
  deps: GetExistingDefaultOrganizationDeps
): Promise<Result<CreateDefaultOrganizationResult, UserManagementError>> {
  try {
    const { organizationRepository, workspaceRepository, pageRepository } =
      deps;
    const userIdVO = new UserId(userId);

    const existingOrganizations =
      await organizationRepository.findByOwnerId(userIdVO);
    const existingDefaultOrg = existingOrganizations.find(
      org => org.entity.isDefault
    );

    if (!existingDefaultOrg) {
      return Result.error(
        new UserManagementError(
          'DEFAULT_ORGANIZATION_NOT_FOUND',
          'Default organization not found'
        )
      );
    }

    const orgId = existingDefaultOrg.id;
    const allWorkspaces =
      await workspaceRepository.findByOrganizationId(orgId);
    const defaultWorkspace = allWorkspaces.find(ws => ws.isDefault);
    const personalWorkspace = allWorkspaces.find(
      ws => ws.isPersonal && ws.ownerId === userId
    );

    if (!defaultWorkspace) {
      return Result.error(
        new UserManagementError(
          'DEFAULT_WORKSPACE_NOT_FOUND',
          'Default workspace not found'
        )
      );
    }

    const defaultPages = await pageRepository.findTreeByWorkspaceId(
      defaultWorkspace.workspaceId
    );
    const firstPage = defaultPages.length > 0 ? defaultPages[0]! : null;
    if (!firstPage) {
      return Result.error(
        new UserManagementError(
          'FIRST_PAGE_NOT_FOUND',
          'First page not found in default workspace'
        )
      );
    }

    let personalPageId = '';
    let personalPageTitle = '';
    let personalPageIcon: string | null = null;
    let personalWorkspaceId = '';
    let personalWorkspaceName = '';
    let personalWorkspaceIsDefault = false;

    if (personalWorkspace) {
      const personalPages = await pageRepository.findTreeByWorkspaceId(
        personalWorkspace.workspaceId
      );
      const firstPersonalPage =
        personalPages.length > 0 ? personalPages[0]! : null;
      personalWorkspaceId = personalWorkspace.workspaceId.value;
      personalWorkspaceName = personalWorkspace.name;
      personalWorkspaceIsDefault = personalWorkspace.isDefault;
      if (firstPersonalPage) {
        personalPageId = firstPersonalPage.pageId.value;
        personalPageTitle = firstPersonalPage.title;
        personalPageIcon = firstPersonalPage.icon;
      }
    }

    const redirectUrl = `/r/${existingDefaultOrg.id.value}/${firstPage.pageId.value}`;

    const result: CreateDefaultOrganizationResult = {
      organization: {
        id: existingDefaultOrg.id.value,
        name: existingDefaultOrg.entity.name,
        organizationType: existingDefaultOrg.entity.organizationType,
        isDefault: true,
        role: 'owner' as const,
        createdAt: existingDefaultOrg.entity.createdAt.toISOString(),
      },
      workspace: {
        id: defaultWorkspace.workspaceId.value,
        name: defaultWorkspace.name,
        isDefault: defaultWorkspace.isDefault,
      },
      page: {
        id: firstPage.pageId.value,
        title: firstPage.title,
        icon: firstPage.icon,
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
    };

    return Result.success(result);
  } catch (error) {
    console.error('[getExistingDefaultOrganization] Error:', error);
    const code: UserManagementErrorCode = 'DEFAULT_ORGANIZATION_FETCH_FAILED';
    return Result.error(
      new UserManagementError(
        code,
        error instanceof Error ? error.message : 'Failed to get default organization'
      )
    );
  }
}
