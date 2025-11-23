// apps/web/src/domains/workspace-management/backend/services/workspace-navigation.service.ts

import type { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import type { OrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization-member.repository.interface';
import type { OrganizationRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization.repository.interface';
import type { WorkspaceRepository } from '../repositories/interfaces/workspace.repository.interface';
import type { PageRepository } from '../repositories/interfaces/page.repository.interface';
import type { WorkspaceMemberRepository } from '../repositories/interfaces/workspace-member.repository.interface';
import type { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';
import type { PageId } from '../../shared/value-objects/page-id.vo';
import type { WorkspaceNavigationService } from './interfaces/workspace-navigation.service.interface';
import type {
  OrganizationWorkspacePageView,
  WorkspaceWithPages,
  PageAccessResult,
  Result,
} from './interfaces/common.types';
import { Result as R } from './interfaces/common.types';

/**
 * Workspace Navigation Service Implementation (Scenario 1)
 *
 * 조직 내 Workspace-Page 조회 및 접근 권한 검증을 담당
 */
export class DefaultWorkspaceNavigationService
  implements WorkspaceNavigationService
{
  constructor(
    private workspaceRepo: WorkspaceRepository,
    private pageRepo: PageRepository,
    private workspaceMemberRepo: WorkspaceMemberRepository,
    private orgMemberRepo: OrganizationMemberRepository,
    private orgRepo?: OrganizationRepository
  ) {}

  /**
   * 조직의 Workspace-Page 목록 조회
   *
   * @param orgId - 조직 ID
   * @param userId - 사용자 ID
   * @param cookiePageId - 쿠키에 저장된 최근 방문 페이지 ID (선택)
   * @returns OrganizationWorkspacePageView (성공) | Error code (실패)
   */
  async getOrganizationWorkspacePageView(
    orgId: OrganizationId,
    userId: string,
    cookiePageId?: string
  ): Promise<Result<OrganizationWorkspacePageView>> {
    // 1. 조직 멤버십 확인 (Fail-fast)
    const isOrgMember = await this.orgMemberRepo.isMember(
      orgId,
      new UserId(userId)
    );
    if (!isOrgMember) {
      return R.err('NOT_ORG_MEMBER');
    }

    // 2. 조직 정보 조회 (for SEO metadata)
    let organizationName = 'Organization';
    if (this.orgRepo) {
      const org = await this.orgRepo.findById(orgId);
      if (org) {
        organizationName = org.entity.name;
      }
    }

    // 3. Workspace 목록 조회 (Default 우선 정렬)
    const allWorkspaces = await this.workspaceRepo.findByOrganizationId(orgId);

    // 4. 개인 워크스페이스 필터링: 자신의 개인 워크스페이스만 포함
    const workspaces = allWorkspaces.filter(ws => {
      // 일반 워크스페이스(isPersonal=false)는 모두 포함
      if (!ws.isPersonal) return true;
      // 개인 워크스페이스는 소유자만 볼 수 있음
      return ws.ownerId === userId;
    });

    // 5. 각 Workspace의 Page 트리 조회 (재귀 CTE)
    const workspacesWithPages: WorkspaceWithPages[] = await Promise.all(
      workspaces.map(async ws => {
        const pageTree = await this.pageRepo.findTreeByWorkspaceId(
          ws.workspaceId
        );
        return {
          workspaceId: ws.workspaceId.value,
          name: ws.name,
          description: ws.description,
          icon: ws.icon,
          isDefault: ws.isDefault,
          isPersonal: ws.isPersonal,
          ownerId: ws.ownerId,
          pageTree,
          pageCount: pageTree.length,
          workspaceName: ws.name,
          organizationName,
        };
      })
    );

    // 6. 쿠키 검증 및 Fallback
    let selectedPageId: string | null = null;

    if (cookiePageId) {
      // 쿠키에 저장된 페이지 검증
      const cookiePage = await this.pageRepo.findById({
        value: cookiePageId,
      } as PageId);

      // 쿠키 페이지가 유효한지 확인 (존재 && 해당 조직의 Workspace에 속함)
      const belongsToOrg = cookiePage
        ? workspacesWithPages.some(ws =>
            ws.pageTree.some(p => p.pageId.value === cookiePageId)
          )
        : false;

      if (cookiePage && belongsToOrg) {
        selectedPageId = cookiePageId;
      } else {
        // 무효한 쿠키 → Fallback
        selectedPageId =
          this.findDefaultWorkspaceFirstPage(workspacesWithPages);
      }
    } else {
      // 쿠키 없음 → Fallback
      selectedPageId = this.findDefaultWorkspaceFirstPage(workspacesWithPages);
    }

    // 7. OrganizationWorkspacePageView 반환
    return R.ok({
      organizationId: orgId.value,
      workspaces: workspacesWithPages,
      selectedPageId,
    });
  }

  /**
   * Page 접근 권한 검증
   *
   * @param orgId - 조직 ID
   * @param workspaceId - Workspace ID
   * @param pageId - Page ID
   * @param userId - 사용자 ID
   * @returns PageAccessResult (성공) | Error code (실패)
   */
  async verifyPageAccess(
    orgId: OrganizationId,
    workspaceId: WorkspaceId,
    pageId: PageId,
    userId: string
  ): Promise<Result<PageAccessResult>> {
    // 1. 조직 멤버십 및 권한 확인 (Fail-fast)
    const orgMemberRole = await this.orgMemberRepo.findMemberRole(
      orgId,
      new UserId(userId)
    );
    if (!orgMemberRole) {
      return R.err('NOT_ORG_MEMBER');
    }

    // 2. Workspace 조회
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      return R.err('WORKSPACE_NOT_FOUND');
    }

    // 3. Workspace 초대 여부 확인 (Default는 자동 허용)
    if (workspace.isDefault) {
      // Default Workspace는 조직 멤버 자동 접근
    } else {
      // 일반 Workspace는 초대 여부 확인
      const isInvited = await this.workspaceMemberRepo.isMember(
        workspaceId,
        userId
      );
      if (!isInvited) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }
    }

    // 4. Page 조회
    const page = await this.pageRepo.findById(pageId);
    if (!page) {
      return R.err('PAGE_NOT_FOUND');
    }

    // 5. Page가 해당 Workspace에 속하는지 확인
    if (!page.workspaceId.equals(workspaceId)) {
      return R.err('BAD_REQUEST');
    }

    // 6. Result.ok with userRole (조직 role 반환)
    return R.ok({
      page,
      userRole: orgMemberRole.value,
    });
  }

  /**
   * Default Workspace의 첫 번째 페이지 ID를 찾는다
   *
   * @param workspaces - Workspace 목록
   * @returns 첫 페이지 ID 또는 null
   */
  private findDefaultWorkspaceFirstPage(
    workspaces: WorkspaceWithPages[]
  ): string | null {
    const defaultWorkspace = workspaces.find(ws => ws.isDefault);
    return defaultWorkspace?.pageTree[0]?.pageId.value || null;
  }
}
