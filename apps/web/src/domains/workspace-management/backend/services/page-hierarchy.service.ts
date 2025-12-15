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

      // 4. 같은 부모의 children 조회하여 maxOrder 계산
      const allPages = await this.pageRepo.findTreeByWorkspaceId(workspaceId);
      const siblings = allPages.filter(p => {
        const pParentId = p.parentId?.value || null;
        const targetParentId = parentId?.value || null;
        return pParentId === targetParentId;
      });
      const maxOrder =
        siblings.length > 0 ? Math.max(...siblings.map(p => p.order)) : -1;
      const newOrder = maxOrder + 1;

      // 5. Page Aggregate 생성
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

      // 6. order 업데이트 (같은 부모의 마지막 순서로)
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
   * @returns void (성공) | Error code (실패)
   */
  async movePage(
    pageId: PageId,
    newParentId: PageId | null,
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

      // 6. Page Aggregate 재구성
      const pageAgg = new PageAggregate(page);

      // 7. move 호출 (순환 참조 체크 포함)
      pageAgg.move(
        {
          pageId: pageId.value,
          newParentId: newParentId?.value,
        },
        newParentPage,
        ancestors
      );

      // 8. Page 저장 (parent_id, depth 업데이트)
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
   * @param workspaceId - Workspace ID
   * @param parentId - 부모 페이지 ID (undefined면 루트 레벨)
   * @param orderedPageIds - 순서가 정해진 페이지 ID 배열
   * @param userId - 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  async reorderPages(
    workspaceId: WorkspaceId,
    parentId: PageId | undefined,
    orderedPageIds: string[],
    userId: string
  ): Promise<Result<void>> {
    try {
      // 1. Workspace 멤버십 확인
      const isMember = await this.workspaceMemberRepo.isMember(
        workspaceId,
        userId
      );
      if (!isMember) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }

      // 2. 페이지들이 모두 같은 부모를 가지고 있는지 확인
      if (orderedPageIds.length > 0) {
        const allPages = await this.pageRepo.findTreeByWorkspaceId(workspaceId);
        const targetPages = allPages.filter(p =>
          orderedPageIds.includes(p.pageId.value)
        );

        // Verify all requested pages were found
        if (targetPages.length !== orderedPageIds.length) {
          return R.err('PAGE_NOT_FOUND');
        }

        // 모든 페이지가 같은 부모를 가지고 있는지 확인
        const expectedParentId = parentId?.value || null;
        for (const page of targetPages) {
          const pageParentId = page.parentId?.value || null;
          if (pageParentId !== expectedParentId) {
            return R.err('INVALID_PAGE_ORDER');
          }
        }
      }

      // 3. Repository를 통해 순서 업데이트 (트랜잭션 포함)
      await this.pageRepo.reorderPages(parentId, orderedPageIds);

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
