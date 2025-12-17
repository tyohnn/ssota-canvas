// apps/web/src/domains/workspace-management/backend/services/page-hierarchy.service.ts

import type { PageRepository } from '../repositories/interfaces/page.repository.interface';
import type { WorkspaceMemberRepository } from '../repositories/interfaces/workspace-member.repository.interface';
import type { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';
import type { PageId } from '../../shared/value-objects/page-id.vo';
import type { PageHierarchyService } from './interfaces/page-hierarchy.service.interface';
import type { Result } from './interfaces/common.types';
import { Result as R } from './interfaces/common.types';
import { PageAggregate } from '../../shared/aggregates/page.aggregate';
import { isWorkspaceManagementError } from '../../shared/errors/workspace-management.error';
import { generateKeyBetween } from 'fractional-indexing';

/**
 * Page Hierarchy Service Implementation (Scenario 4)
 *
 * Page 생성, 이동, 정보 수정을 담당
 */
export class DefaultPageHierarchyService implements PageHierarchyService {
  constructor(
    private pageRepo: PageRepository,
    private workspaceMemberRepo: WorkspaceMemberRepository
  ) {}

  /**
   * Page 생성 (Scenario 4)
   *
   * @param workspaceId - Workspace ID
   * @param parentId - 부모 페이지 ID (null이면 최상위)
   * @param title - 페이지 제목 (기본값: "Untitled")
   * @param icon - 페이지 아이콘 (기본값: "Briefcase")
   * @param userId - 사용자 ID
   * @returns pageId (성공) | Error code (실패)
   */
  async createPage(
    workspaceId: WorkspaceId,
    parentId: PageId | null,
    title: string,
    icon: string | null,
    userId: string
  ): Promise<Result<string>> {
    try {
      // 1. Workspace 멤버십 확인
      const isMember = await this.workspaceMemberRepo.isMember(
        workspaceId,
        userId
      );
      if (!isMember) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }

      // 2. 부모 페이지 조회 (parentId가 있는 경우)
      let parentPage: any = null;
      if (parentId) {
        parentPage = await this.pageRepo.findById(parentId);
        if (!parentPage) {
          return R.err('PAGE_NOT_FOUND');
        }

        // 3. 부모 페이지가 같은 Workspace에 속하는지 확인
        if (parentPage.workspaceId.value !== workspaceId.value) {
          return R.err('INVALID_PARENT_PAGE');
        }
      }

      // 4. 같은 부모의 children 조회하여 fractional index 계산 (직접 자식만 조회 - 효율적)
      const siblings = await this.pageRepo.findChildrenByParentId(
        parentId,
        workspaceId
      );

      // 5. 형제 페이지들을 order로 정렬 (이미 정렬되어 있지만 명시적으로)
      const sortedSiblings = [...siblings].sort((a, b) =>
        a.order.localeCompare(b.order)
      );

      // 6. 마지막 형제의 order 가져오기 (없으면 null)
      const lastSiblingOrder =
        sortedSiblings.length > 0
          ? sortedSiblings[sortedSiblings.length - 1]!.order
          : null;

      // 7. 새 order 생성 (맨 뒤에 추가)
      const newOrder = generateKeyBetween(lastSiblingOrder, null);

      // 8. Page Aggregate 생성
      const pageAgg = PageAggregate.create(
        {
          workspaceId: workspaceId.value,
          parentId: parentId?.value,
          title,
          icon: icon || 'Briefcase',
          createdBy: userId,
        },
        parentPage
      );

      // 9. order 업데이트 (fractional index)
      pageAgg.page.updateOrder(newOrder);

      // 7. Page 저장
      await this.pageRepo.save(pageAgg);

      // 8. Result.ok 반환 (pageId)
      return R.ok(pageAgg.page.pageId.value);
    } catch (error) {
      if (isWorkspaceManagementError(error)) {
        return R.err(error.code);
      }
      if (error instanceof Error) {
        return R.err(error.message);
      }
      return R.err('UNKNOWN_ERROR');
    }
  }

  /**
   * Page 이동 (Scenario 4)
   *
   * 순환 참조 체크 포함
   *
   * @param pageId - 이동할 페이지 ID
   * @param newParentId - 새 부모 페이지 ID (null이면 최상위)
   * @param userId - 사용자 ID
   * @param insertIndex - 삽입 위치 (0부터 시작, 없으면 맨 뒤) - deprecated
   * @param prevPageId - 이전 페이지 ID (UI 드롭 순서)
   * @param nextPageId - 다음 페이지 ID (UI 드롭 순서)
   * @returns void (성공) | Error code (실패)
   */
  async movePage(
    pageId: PageId,
    newParentId: PageId | null,
    userId: string,
    insertIndex?: number,
    prevPageId?: PageId,
    nextPageId?: PageId
  ): Promise<Result<void>> {
    try {
      // 1. Page 조회
      const page = await this.pageRepo.findById(pageId);
      if (!page) {
        return R.err('PAGE_NOT_FOUND');
      }

      // 2. Workspace 멤버십 확인
      const isMember = await this.workspaceMemberRepo.isMember(
        page.workspaceId,
        userId
      );
      if (!isMember) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }

      // 3. 새 부모 페이지 조회 (newParentId가 있는 경우)
      let newParentPage: any = null;
      let ancestors: any[] = [];
      if (newParentId) {
        newParentPage = await this.pageRepo.findById(newParentId);
        if (!newParentPage) {
          return R.err('PAGE_NOT_FOUND');
        }

        // 4. 새 부모가 같은 Workspace에 속하는지 확인
        if (newParentPage.workspaceId.value !== page.workspaceId.value) {
          return R.err('INVALID_PARENT_PAGE');
        }

        // 5. 순환 참조 체크: 재귀 CTE로 ancestors 조회
        ancestors = await this.pageRepo.findAncestors(newParentId);
      }

      // 6. 새 위치의 형제 페이지 조회 (직접 자식만 조회 - 효율적)
      const newSiblings = await this.pageRepo.findChildrenByParentId(
        newParentId,
        page.workspaceId
      );
      // 이동할 페이지 자체는 제외
      const siblingsExcludingSelf = newSiblings.filter(
        p => p.pageId.value !== pageId.value
      );

      // 7. 형제 페이지들을 order로 정렬 (이미 정렬되어 있지만 명시적으로)
      const sortedNewSiblings = [...siblingsExcludingSelf].sort((a, b) =>
        a.order.localeCompare(b.order)
      );

      // 8. fractional index 계산
      let newOrder: string;

      // prevPageId/nextPageId가 제공된 경우 우선 사용 (UI 드롭 순서 기반)
      if (prevPageId || nextPageId) {
        const prevPage = prevPageId
          ? sortedNewSiblings.find(p => p.pageId.value === prevPageId.value)
          : null;
        const nextPage = nextPageId
          ? sortedNewSiblings.find(p => p.pageId.value === nextPageId.value)
          : null;

        const prevOrder = prevPage?.order || null;
        const nextOrder = nextPage?.order || null;

        newOrder = generateKeyBetween(prevOrder, nextOrder);
      } else if (
        insertIndex !== undefined &&
        insertIndex >= 0 &&
        insertIndex <= sortedNewSiblings.length
      ) {
        // fallback: insertIndex 사용 (deprecated)
        const prevOrder =
          insertIndex > 0
            ? sortedNewSiblings[insertIndex - 1]?.order || null
            : null;
        const nextOrder =
          insertIndex < sortedNewSiblings.length
            ? sortedNewSiblings[insertIndex]?.order || null
            : null;

        newOrder = generateKeyBetween(prevOrder, nextOrder);
      } else {
        // insertIndex가 없거나 범위를 벗어난 경우: 맨 뒤에 추가
        const lastSiblingOrder =
          sortedNewSiblings.length > 0
            ? sortedNewSiblings[sortedNewSiblings.length - 1]!.order
            : null;

        newOrder = generateKeyBetween(lastSiblingOrder, null);
      }

      // 10. Page Aggregate 재구성
      const pageAgg = new PageAggregate(page);

      // 11. move 호출 (순환 참조 체크 포함)
      pageAgg.move(
        {
          pageId: pageId.value,
          newParentId: newParentId?.value,
          newOrder,
        },
        newParentPage,
        ancestors
      );

      // 12. order 업데이트
      pageAgg.page.updateOrder(newOrder);

      // 13. Page 저장 (parent_id, depth, order 업데이트)
      await this.pageRepo.save(pageAgg);

      // 9. 하위 페이지들 depth 재귀 업데이트
      const oldDepth = page.depth;
      const newDepth = pageAgg.page.depth;
      const depthDelta = newDepth - oldDepth;

      if (depthDelta !== 0) {
        await this.pageRepo.updateChildrenDepth(pageId, depthDelta);
      }

      return R.ok(undefined);
    } catch (error) {
      if (isWorkspaceManagementError(error)) {
        return R.err(error.code);
      }
      if (error instanceof Error) {
        return R.err(error.message);
      }
      return R.err('UNKNOWN_ERROR');
    }
  }

  /**
   * Page 정보 수정 (Scenario 4)
   *
   * @param pageId - Page ID
   * @param title - 새 제목 (선택)
   * @param icon - 새 아이콘 (선택)
   * @param userId - 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  async updatePageInfo(
    pageId: PageId,
    title: string | undefined,
    icon: string | null | undefined,
    userId: string
  ): Promise<Result<void>> {
    try {
      // 1. Page 조회
      const page = await this.pageRepo.findById(pageId);
      if (!page) {
        return R.err('PAGE_NOT_FOUND');
      }

      // 2. Workspace 멤버십 확인
      const isMember = await this.workspaceMemberRepo.isMember(
        page.workspaceId,
        userId
      );
      if (!isMember) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }

      // 3. Page Aggregate 재구성
      const pageAgg = new PageAggregate(page);

      // 4. updateInfo 호출 (null을 undefined로 변환)
      pageAgg.updateInfo({
        pageId: pageId.value,
        title,
        icon: icon === null ? undefined : icon,
        updatedBy: userId,
      });

      // 5. Page 저장
      await this.pageRepo.save(pageAgg);

      return R.ok(undefined);
    } catch (error) {
      if (isWorkspaceManagementError(error)) {
        return R.err(error.code);
      }
      if (error instanceof Error) {
        return R.err(error.message);
      }
      return R.err('UNKNOWN_ERROR');
    }
  }

  /**
   * Page 순서 재정렬 (Scenario 4)
   *
   * ⚠️ 주의: 권한(Workspace 멤버십) 확인은 Action layer에서 수행한다.
   */
  async reorderPages(
    workspaceId: WorkspaceId,
    parentId: PageId | null,
    orderedPageIds: string[]
  ): Promise<Result<void>> {
    try {
      // 1. 입력 검증 (중복/빈 값)
      const filteredIds = orderedPageIds.filter(Boolean);
      const unique = new Set(filteredIds);
      if (unique.size !== filteredIds.length) {
        return R.err('INVALID_REQUEST');
      }

      // 2. 같은 부모의 siblings 조회 (직접 자식만 조회 - 효율적)
      const siblings = await this.pageRepo.findChildrenByParentId(
        parentId,
        workspaceId
      );

      const siblingsById = new Map(siblings.map(p => [p.pageId.value, p]));

      // 3. 요청된 pageId들이 siblings에 속하는지 검증
      for (const id of filteredIds) {
        if (!siblingsById.has(id)) {
          return R.err('PAGE_NOT_FOUND');
        }
      }

      // 4. fractional index 계산 (앞에서부터 단조 증가)
      const updates: Array<{ pageId: string; order: string }> = [];
      let prev: string | null = null;
      for (const id of filteredIds) {
        const next = null;
        const newOrder = generateKeyBetween(prev, next);
        updates.push({ pageId: id, order: newOrder });
        prev = newOrder;
      }

      // 5. Batch update
      await this.pageRepo.batchUpdateOrder(updates);

      return R.ok(undefined);
    } catch (error) {
      if (isWorkspaceManagementError(error)) {
        return R.err(error.code);
      }
      if (error instanceof Error) {
        return R.err(error.message);
      }
      return R.err('UNKNOWN_ERROR');
    }
  }
}
