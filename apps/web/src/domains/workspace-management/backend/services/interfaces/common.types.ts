// apps/web/src/domains/workspace-management/backend/services/interfaces/common.types.ts

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
  description: string | null;
  icon: string | null;
  isDefault: boolean;
  isPersonal: boolean;
  ownerId: string | null;
  pageTree: Page[];
  pageCount: number;
  // For SEO and display purposes
  workspaceName: string; // alias for 'name'
  organizationName: string;
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
 * Create Workspace Result
 *
 * Workspace 생성 성공 시 반환 데이터
 * SSOT: 생성된 workspace와 페이지의 실제 정보를 반환
 */
export interface CreateWorkspaceResult {
  workspaceId: string;
  workspaceName: string;
  workspaceIsDefault: boolean;
  firstPageId: string;
  firstPageTitle: string;
  firstPageIcon: string | null;
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
