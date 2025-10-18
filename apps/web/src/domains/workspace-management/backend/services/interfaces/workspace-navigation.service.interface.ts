// apps/web/src/domains/workspace-management/backend/services/interfaces/workspace-navigation.service.interface.ts

import type { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import type { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import type { PageId } from '../../../shared/value-objects/page-id.vo';
import type {
  OrganizationWorkspacePageView,
  PageAccessResult,
  Result,
} from './common.types';

/**
 * Workspace Navigation Service Interface (Scenario 1)
 *
 * 조직 내 Workspace-Page 조회 및 접근 권한 검증을 담당
 */
export interface WorkspaceNavigationService {
  /**
   * 조직의 Workspace-Page 목록 조회
   *
   * @param orgId - 조직 ID
   * @param userId - 사용자 ID
   * @param cookiePageId - 쿠키에 저장된 최근 방문 페이지 ID (선택)
   * @returns OrganizationWorkspacePageView (성공) | Error code (실패)
   */
  getOrganizationWorkspacePageView(
    orgId: OrganizationId,
    userId: string,
    cookiePageId?: string
  ): Promise<Result<OrganizationWorkspacePageView>>;

  /**
   * Page 접근 권한 검증
   *
   * @param orgId - 조직 ID
   * @param workspaceId - Workspace ID
   * @param pageId - Page ID
   * @param userId - 사용자 ID
   * @returns PageAccessResult (성공) | Error code (실패)
   */
  verifyPageAccess(
    orgId: OrganizationId,
    workspaceId: WorkspaceId,
    pageId: PageId,
    userId: string
  ): Promise<Result<PageAccessResult>>;
}

