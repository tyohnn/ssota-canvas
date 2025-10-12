// apps/web/src/domains/workspace-management/shared/dtos/index.ts

/**
 * DTOs for Workspace Management Domain
 *
 * 모든 DTO는 Serializable해야 함 (Next.js Server Actions 호환)
 */

// ────────────────────────────────────────────────────────────
// Workspace DTOs
// ────────────────────────────────────────────────────────────

export interface WorkspaceDTO {
  workspaceId: string;
  organizationId: string;
  name: string;
  description: string | null;
  icon: string | null;
  isDefault: boolean;
  createdBy: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface WorkspaceWithPagesDTO {
  workspaceId: string;
  name: string;
  description: string | null;
  icon: string | null;
  isDefault: boolean;
  pageTree: PageTreeNodeDTO[];
  pageCount: number;
}

// ────────────────────────────────────────────────────────────
// Page DTOs
// ────────────────────────────────────────────────────────────

export interface PageDTO {
  pageId: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  order: number;
  depth: number;
  createdBy: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface PageTreeNodeDTO {
  id: string;
  title: string;
  icon: string | null;
  children: PageTreeNodeDTO[]; // 재귀 구조
  depth: number;
  isFavorite: boolean;
  lastModified: string; // ISO string

  // ExplorerTree용 추가 필드
  parentId: string | null;
  order: number;
}

// ────────────────────────────────────────────────────────────
// Read Model DTOs
// ────────────────────────────────────────────────────────────

export interface OrganizationWorkspacePageViewDTO {
  organizationId: string;
  workspaces: WorkspaceWithPagesDTO[];
  selectedPageId: string | null;
}

// ────────────────────────────────────────────────────────────
// Request/Response DTOs
// ────────────────────────────────────────────────────────────

export interface GetWorkspacePagesRequest {
  organizationId: string;
  cookiePageId?: string;
}

export interface GetPageDetailsRequest {
  organizationId: string;
  workspaceId: string;
  pageId: string;
}

// Scenario 2: Workspace 생성 및 수정
export interface CreateWorkspaceRequest {
  organizationId: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface CreateWorkspaceResponse {
  workspaceId: string;
  firstPageId: string;
}

export interface UpdateWorkspaceInfoRequest {
  workspaceId: string;
  name?: string;
  description?: string | null;
  icon?: string | null;
}

export interface PageAccessResultDTO {
  pageId: string;
  title: string;
  icon: string | null;
  workspaceId: string;
  workspaceName: string;
  userRole: string; // organization role
}

export interface AccessDeniedDTO {
  code: 'NOT_ORG_MEMBER' | 'NOT_WORKSPACE_MEMBER';
  message: string;
  workspaceName?: string;
}

// ────────────────────────────────────────────────────────────
// Server Action Result Type
// ────────────────────────────────────────────────────────────

export type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };
