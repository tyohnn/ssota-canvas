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
  description: string | null;
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
 * Create Workspace Result
 *
 * Workspace 생성 성공 시 반환 데이터
 */
export interface CreateWorkspaceResult {
  workspaceId: string;
  firstPageId: string;
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

  /**
   * Workspace 생성 (Scenario 2)
   *
   * 트랜잭션:
   * 1. Workspace 생성
   * 2. 생성자를 Workspace 멤버로 추가
   * 3. 초기 "Untitled" 페이지 생성
   *
   * @param orgId - 조직 ID
   * @param name - Workspace 이름 (1-100자)
   * @param description - Workspace 설명 (최대 500자)
   * @param icon - Workspace 아이콘
   * @param userId - 사용자 ID
   * @returns CreateWorkspaceResult (성공) | Error code (실패)
   */
  createWorkspace(
    orgId: OrganizationId,
    name: string,
    description: string | null,
    icon: string | null,
    userId: string
  ): Promise<Result<CreateWorkspaceResult>>;

  /**
   * Workspace 정보 수정 (Scenario 2)
   *
   * @param workspaceId - Workspace ID
   * @param name - 새 이름 (선택)
   * @param description - 새 설명 (선택)
   * @param icon - 새 아이콘 (선택)
   * @param userId - 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  updateWorkspaceInfo(
    workspaceId: WorkspaceId,
    name: string | undefined,
    description: string | null | undefined,
    icon: string | null | undefined,
    userId: string
  ): Promise<Result<void>>;

  /**
   * Workspace 멤버 초대 (Scenario 3)
   *
   * 트랜잭션:
   * 1. 각 이메일에 대해 조직 멤버 검색
   * 2. 이미 Workspace 멤버인지 확인
   * 3. 초대 생성
   * 4. Notification Domain 통합 (알림 생성)
   *
   * @param workspaceId - Workspace ID
   * @param memberEmails - 초대할 멤버 이메일 배열
   * @param userId - 초대하는 사용자 ID
   * @returns 초대한 멤버 수 (성공) | Error code (실패)
   */
  inviteWorkspaceMembers(
    workspaceId: WorkspaceId,
    memberEmails: string[],
    userId: string
  ): Promise<Result<number>>;

  /**
   * Workspace 초대 수락 (Scenario 3)
   *
   * 트랜잭션:
   * 1. 초대 상태를 accepted로 변경
   * 2. Workspace 멤버로 추가
   * 3. Notification Domain 통합 (알림 업데이트)
   *
   * @param invitationId - 초대 ID
   * @param userId - 수락하는 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  acceptWorkspaceInvitation(
    invitationId: string,
    userId: string
  ): Promise<Result<void>>;

  /**
   * Workspace 초대 거절 (Scenario 3)
   *
   * @param invitationId - 초대 ID
   * @param userId - 거절하는 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  rejectWorkspaceInvitation(
    invitationId: string,
    userId: string
  ): Promise<Result<void>>;
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
