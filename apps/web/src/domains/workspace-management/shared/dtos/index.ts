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
// Server Action Result Type
// ────────────────────────────────────────────────────────────

export type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };
