// apps/web/src/domains/workspace-management/backend/services/interfaces/page-hierarchy.service.interface.ts

import type { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import type { PageId } from '../../../shared/value-objects/page-id.vo';
import type { Result } from './common.types';

/**
 * Page Hierarchy Service Interface (Scenario 4)
 *
 * Page 생성, 이동, 정보 수정을 담당
 */
export interface PageHierarchyService {
  /**
   * Page 생성 (Scenario 4)
   *
   * @param workspaceId - Workspace ID
   * @param parentId - 부모 페이지 ID (null이면 최상위)
   * @param title - 페이지 제목 (기본값: "Untitled")
   * @param icon - 페이지 아이콘 (기본값: "📄")
   * @param userId - 사용자 ID
   * @returns pageId (성공) | Error code (실패)
   */
  createPage(
    workspaceId: WorkspaceId,
    parentId: PageId | null,
    title: string,
    icon: string | null,
    userId: string
  ): Promise<Result<string>>;

  /**
   * Page 이동 (Scenario 4)
   *
   * 순환 참조 체크 포함
   *
   * @param pageId - 이동할 페이지 ID
   * @param newParentId - 새 부모 페이지 ID (null이면 최상위)
   * @param userId - 사용자 ID
   * @param insertIndex - 삽입 위치 (0부터 시작, 없으면 맨 뒤) - deprecated, prevPageId/nextPageId 사용 권장
   * @param prevPageId - 이전 페이지 ID (UI 드롭 순서)
   * @param nextPageId - 다음 페이지 ID (UI 드롭 순서)
   * @returns void (성공) | Error code (실패)
   */
  movePage(
    pageId: PageId,
    newParentId: PageId | null,
    userId: string,
    insertIndex?: number,
    prevPageId?: PageId,
    nextPageId?: PageId
  ): Promise<Result<void>>;

  /**
   * Page 정보 수정 (Scenario 4)
   *
   * @param pageId - Page ID
   * @param title - 새 제목 (선택)
   * @param icon - 새 아이콘 (선택)
   * @param userId - 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  updatePageInfo(
    pageId: PageId,
    title: string | undefined,
    icon: string | null | undefined,
    userId: string
  ): Promise<Result<void>>;

  /**
   * Page 순서 재정렬 (Scenario 4)
   *
   * ⚠️ 주의: 권한(Workspace 멤버십) 확인은 Action layer에서 수행한다.
   *
   * @param workspaceId - Workspace ID
   * @param parentId - 부모 페이지 ID (null이면 최상위)
   * @param orderedPageIds - 순서대로 정렬된 페이지 ID 배열
   * @returns void (성공) | Error code (실패)
   */
  reorderPages(
    workspaceId: WorkspaceId,
    parentId: PageId | null,
    orderedPageIds: string[]
  ): Promise<Result<void>>;
}
