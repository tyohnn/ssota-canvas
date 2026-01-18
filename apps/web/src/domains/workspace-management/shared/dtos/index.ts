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
  isPersonal: boolean;
  ownerId: string | null;
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
  isPersonal: boolean;
  ownerId: string | null;
  pageTree: PageTreeNodeDTO[];
  pageCount: number;
  // For SEO and display purposes
  workspaceName: string; // alias for 'name'
  organizationName: string;
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
  order: string; // Fractional index (e.g., 'a0', 'a1', 'a0V')
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
  order: string; // Fractional index (e.g., 'a0', 'a1', 'a0V')
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
  workspaceName: string;
  workspaceIsDefault: boolean;
  firstPageId: string;
  firstPageTitle: string;
  firstPageIcon: string | null;
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

// Scenario 3: Workspace 멤버 초대 및 수락/거절
export interface InviteWorkspaceMemberRequest {
  workspaceId: string;
  memberEmails: string[];
}

export interface InviteWorkspaceMemberResponse {
  invitedCount: number;
}

export interface ProcessInvitationRequest {
  invitationId: string;
}

export interface InvitationSummaryDTO {
  invitationId: string;
  workspaceId: string;
  workspaceName: string;
  workspaceIcon: string | null;
  workspaceDescription: string | null;
  invitedBy: string; // 이름
  organizationName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string; // ISO string
}

export interface OrganizationMemberSearchResultDTO {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isAlreadyMember: boolean;
  hasPendingInvitation: boolean;
}

export interface SearchOrganizationMembersRequest {
  workspaceId: string;
  query: string;
}

/**
 * Workspace 멤버 목록 조회
 */
export interface GetWorkspaceMembersRequest {
  workspaceId: string;
}

export interface WorkspaceMemberDTO {
  userId: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
  joinedAt: string; // ISO 8601
}

export interface WorkspaceInvitationPendingDTO {
  id: string;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  inviterName: string;
  createdAt: string; // ISO 8601
}

export interface WorkspaceMemberView {
  workspaceId: string;
  workspaceName: string;
  currentMembers: WorkspaceMemberDTO[];
  pendingInvitations: WorkspaceInvitationPendingDTO[];
}

// ────────────────────────────────────────────────────────────
// Scenario 4: Page 생성 및 관리
// ────────────────────────────────────────────────────────────

export interface CreatePageRequest {
  workspaceId: string;
  parentId?: string; // null이면 최상위
  title?: string; // 기본값: "Untitled"
  icon?: string; // 기본값: "📄"
}

export interface CreatePageResponse {
  pageId: string;
}

export interface MovePageRequest {
  pageId: string;
  newParentId?: string; // undefined면 최상위
}

export interface UpdatePageInfoRequest {
  pageId: string;
  title?: string;
  icon?: string | null;
}

export interface ReorderPagesRequest {
  workspaceId: string;
  parentId?: string; // undefined면 루트
  orderedPageIds: string[]; // 순서대로 정렬된 페이지 ID 배열
}

export interface DeletePageRequest {
  pageId: string;
}

export interface DuplicatePageRequest {
  pageId: string;
}

export interface DuplicatePageResponse {
  pageId: string; // 복제된 페이지 ID
}

export interface DuplicatePageWithCanvasRequest {
  pageId: string;
}

export interface DuplicatePageWithCanvasResponse {
  pageId: string; // 복제된 페이지 ID
}

// ────────────────────────────────────────────────────────────
// Recent Pages (경량화된 페이지 조회)
// ────────────────────────────────────────────────────────────

export interface GetRecentPagesRequest {
  workspaceId: string;
  limit?: number; // 기본값: 20, 최대: 50
}

export interface RecentPageDTO {
  pageId: string;
  title: string;
  icon: string | null;
  workspaceId: string;
  workspaceName: string;
  updatedAt: string; // ISO string
}

export interface GetRecentPagesResponse {
  pages: RecentPageDTO[];
}

export interface SearchPagesResponse {
  pages: RecentPageDTO[];
  hasMore: boolean; // limit에 도달하면 더 있을 수 있음
}

// ────────────────────────────────────────────────────────────
// Workspace By Organization DTOs
// ────────────────────────────────────────────────────────────

/**
 * 워크스페이스 정보 (조직 정보 포함)
 */
export interface WorkspaceWithOrgDTO {
  id: string;
  name: string;
  icon?: string;
  organizationName?: string;
}

/**
 * 조직별로 그룹핑된 워크스페이스 목록
 */
export interface AllWorkspacesByOrgDTO {
  organizations: {
    id: string;
    name: string;
    workspaces: {
      id: string;
      name: string;
      icon?: string;
    }[];
  }[];
}

// ────────────────────────────────────────────────────────────
// Server Action Result Type
// ────────────────────────────────────────────────────────────

export type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };
