// apps/web/src/domains/workspace-management/backend/services/interfaces/workspace-management.service.interface.ts

import type { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import type { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import type { PageId } from '../../../shared/value-objects/page-id.vo';
import type { Page } from '../../../shared/entities/page.entity';

/**
 * OrganizationWorkspacePageView Read Model
 *
 * 조직의 모든 Workspace-Page 데이터를 통합한 Read Model
 */
export interface OrganizationWorkspacePageView {
  organizationId: string;
  workspaces: WorkspaceWithPages[];
  selectedPageId?: string | null;
}

export interface WorkspaceWithPages {
  workspaceId: string;
  name: string;
  icon: string | null;
  isDefault: boolean;
  pageTree: Page[];
  pageCount: number;
}

/**
 * Page Access Result
 *
 * Page 접근 권한 검증 결과
 */
export interface PageAccessResult {
  page: Page;
  userRole: string; // organization role (owner, admin, member)
}

/**
 * Workspace Management Service Interface
 *
 * Workspace 및 Page Aggregate를 조율하고 Organization Domain과 통합하는 서비스
 */
export interface WorkspaceManagementService {
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

/**
 * Result type for Service responses
 *
 * 성공(ok) 또는 실패(err) 결과를 나타내는 Union Type
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const Result = {
  ok: <T>(data: T): Result<T> => ({ success: true, data }),
  err: <T>(error: string): Result<T> => ({ success: false, error }),
};
