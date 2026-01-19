// apps/web/src/domains/workspace-management/backend/services/page-lifecycle.service.ts

import type { PageRepository } from '../repositories/interfaces/page.repository.interface';
import type { WorkspaceMemberRepository } from '../repositories/interfaces/workspace-member.repository.interface';
import { PageId } from '../../shared/value-objects/page-id.vo';
import type { PageLifecycleService } from './interfaces/page-lifecycle.service.interface';
import type { Result } from './interfaces/common.types';
import { Result as R } from './interfaces/common.types';
import { PageAggregate } from '../../shared/aggregates/page.aggregate';
import { isWorkspaceManagementError } from '../../shared/errors/workspace-management.error';
import type {
  DeletePageCommand,
  DuplicatePageCommand,
} from '../../shared/commands';
import type {
  PageDeletedEvent,
  PageDuplicatedEvent,
} from '../../shared/events';
import { generateKeyBetween } from 'fractional-indexing';
import { CanvasQueryService } from '@/domains/canvas-management/backend/services/canvas-query.service';
import { createAndMountBlock } from '@/domains/canvas-management/backend/services/block-mount';
import { createEdge } from '@/domains/canvas-management/backend/services/edge';
import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-viewport.repository';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';
import type { CreateAndMountBlockRequest } from '@/domains/canvas-management/shared/dtos/requests';
import type { CreateEdgeRequest } from '@/domains/canvas-management/shared/dtos/requests/edge.requests';
import { Page } from '../../shared/entities/page.entity';

/**
 * Page Lifecycle Service Implementation (Scenario 7)
 *
 * Page 삭제, 복제를 담당
 */
export class DefaultPageLifecycleService implements PageLifecycleService {
  constructor(
    private pageRepo: PageRepository,
    private workspaceMemberRepo: WorkspaceMemberRepository
  ) {}

  /**
   * Page 삭제 (Soft Delete)
   *
   * @param params - 삭제 파라미터 (Action에서 전달)
   * @returns PageAggregate (성공) | Error code (실패)
   */
  async deletePage(params: {
    pageId: PageId;
    userId: string;
  }): Promise<Result<PageAggregate>> {
    try {
      // 1. Page 조회
      const page = await this.pageRepo.findById(params.pageId);
      if (!page) {
        return R.err('PAGE_NOT_FOUND');
      }

      // 2. Workspace 멤버십 확인
      const isMember = await this.workspaceMemberRepo.isMember(
        page.workspaceId,
        params.userId
      );
      if (!isMember) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }

      // 3. Page Aggregate 재구성
      const pageAgg = new PageAggregate(page);

      // 4. Delete Command 생성
      const deleteCommand: DeletePageCommand = {
        pageId: params.pageId.value,
        deletedBy: params.userId,
      };

      // 5. Aggregate에 Command 전달
      pageAgg.delete(deleteCommand);

      // 6. Page 저장 (deleted_at 업데이트)
      await this.pageRepo.save(pageAgg);

      // 7. 도메인 이벤트 처리
      const events = pageAgg.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 8. 이벤트 커밋
      pageAgg.markEventsAsCommitted();

      // 9. Aggregate 반환
      return R.ok(pageAgg);
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
   * Page 복제
   *
   * 원본 페이지의 메타데이터를 복제하여 새 페이지 생성
   * - 제목: "{원본 제목} (Copy)"
   * - 같은 부모, order는 원본 바로 다음
   * - 하위 페이지는 복제하지 않음
   *
   * @param params - 복제 파라미터 (Action에서 전달)
   * @returns PageAggregate (성공) | Error code (실패)
   */
  async duplicatePage(params: {
    pageId: PageId;
    userId: string;
  }): Promise<Result<PageAggregate>> {
    try {
      // 1. 원본 Page 조회
      const originalPage = await this.pageRepo.findById(params.pageId);
      if (!originalPage) {
        return R.err('PAGE_NOT_FOUND');
      }

      // 2. Workspace 멤버십 확인
      const isMember = await this.workspaceMemberRepo.isMember(
        originalPage.workspaceId,
        params.userId
      );
      if (!isMember) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }

      // 3. 부모 페이지 조회 (있는 경우)
      let parentPage: any = null;
      if (originalPage.parentId) {
        parentPage = await this.pageRepo.findById(originalPage.parentId);
        if (!parentPage) {
          return R.err('PAGE_NOT_FOUND');
        }
      }

      // 4. 같은 부모의 children 조회하여 원본 페이지 바로 다음 fractional index 계산 (직접 자식만 조회 - 효율적)
      const siblings = await this.pageRepo.findChildrenByParentId(
        originalPage.parentId,
        originalPage.workspaceId
      );

      // 5. 형제 페이지들을 order로 정렬 (이미 정렬되어 있지만 명시적으로)
      const sortedSiblings = [...siblings].sort((a, b) =>
        a.order.localeCompare(b.order)
      );

      // 6. 원본 페이지의 인덱스 찾기
      const originalIndex = sortedSiblings.findIndex(
        p => p.pageId.value === originalPage.pageId.value
      );

      // 7. 원본의 다음 페이지 찾기
      const nextSibling =
        originalIndex >= 0 && originalIndex < sortedSiblings.length - 1
          ? sortedSiblings[originalIndex + 1]
          : null;

      // 8. 원본과 다음 페이지 사이의 fractional index 생성
      const newOrder = generateKeyBetween(
        originalPage.order,
        nextSibling?.order || null
      );

      // 9. Duplicate Command 생성
      const duplicateCommand: DuplicatePageCommand = {
        pageId: params.pageId.value,
        newTitle: `${originalPage.title} (Copy)`,
        newOrder,
        duplicatedBy: params.userId,
      };

      // 6. Aggregate 생성 (Command 패턴)
      const duplicatedPageAgg = PageAggregate.duplicate(
        duplicateCommand,
        originalPage,
        parentPage
      );

      // 7. Page 저장
      await this.pageRepo.save(duplicatedPageAgg);

      // 8. 도메인 이벤트 처리
      const events = duplicatedPageAgg.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 9. 이벤트 커밋
      duplicatedPageAgg.markEventsAsCommitted();

      // 10. Aggregate 반환
      return R.ok(duplicatedPageAgg);
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
   * Page 복제 (캔버스 데이터 포함)
   *
   * 같은 워크스페이스 내에서 원본 페이지의 메타데이터와 캔버스 데이터(블록, 엣지)를 복제하여 새 페이지 생성
   * - 제목: "{원본 제목} (Copy)"
   * - 원본과 같은 부모 아래에 복제
   * - 원본 바로 다음 위치에 배치
   * - 캔버스 데이터(블록, 엣지) 포함
   *
   * @param params - 복제 파라미터 (Action에서 전달)
   * @returns PageAggregate (성공) | Error code (실패)
   */
  async duplicatePageWithCanvas(params: {
    pageId: PageId;
    userId: string;
  }): Promise<Result<PageAggregate>> {
    try {
      // 1. 원본 Page 조회
      const originalPage = await this.pageRepo.findById(params.pageId);
      if (!originalPage) {
        return R.err('PAGE_NOT_FOUND');
      }

      // 2. Workspace 멤버십 확인 (원본 워크스페이스)
      const isSourceMember = await this.workspaceMemberRepo.isMember(
        originalPage.workspaceId,
        params.userId
      );
      if (!isSourceMember) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }

      // 3. 부모 페이지 조회 (있는 경우)
      let parentPage: any = null;
      let newParentId: string | undefined = undefined;
      if (originalPage.parentId) {
        parentPage = await this.pageRepo.findById(originalPage.parentId);
        if (!parentPage) {
          return R.err('PAGE_NOT_FOUND');
        }
        newParentId = originalPage.parentId.value;
      }

      // 4. 같은 부모의 children 조회하여 원본 페이지 바로 다음 fractional index 계산
      const siblings = await this.pageRepo.findChildrenByParentId(
        originalPage.parentId,
        originalPage.workspaceId
      );

      const sortedSiblings = [...siblings].sort((a, b) =>
        a.order.localeCompare(b.order)
      );

      const originalIndex = sortedSiblings.findIndex(
        p => p.pageId.value === originalPage.pageId.value
      );

      const nextSibling =
        originalIndex >= 0 && originalIndex < sortedSiblings.length - 1
          ? sortedSiblings[originalIndex + 1]
          : null;

      const newOrder = generateKeyBetween(
        originalPage.order,
        nextSibling?.order || null
      );

      // 5. Duplicate Command 생성
      const duplicateCommand: DuplicatePageCommand = {
        pageId: params.pageId.value,
        newTitle: `${originalPage.title} (Copy)`,
        newOrder,
        duplicatedBy: params.userId,
      };

      // 6. Aggregate 생성 (Command 패턴) - PageAggregate.duplicate 사용
      const duplicatedPageAgg = PageAggregate.duplicate(
        duplicateCommand,
        originalPage,
        parentPage
      );

      // 7. Page 저장
      await this.pageRepo.save(duplicatedPageAgg);
      const newPageId = duplicatedPageAgg.page.pageId.value;

      // 8. 캔버스 데이터 복제
      const blockMountRepo = new DrizzleBlockMountRepository();
      const edgeRepo = new DrizzleEdgeRepository();
      const blockRepo = new DrizzleBlockRepository();
      const viewportRepo = new DrizzleViewportRepository();

      const canvasQueryService = new CanvasQueryService(
        blockMountRepo,
        edgeRepo,
        viewportRepo
      );

      // 원본 캔버스 데이터 조회
      const canvasViewResult = await canvasQueryService.getCanvasView(
        params.pageId,
        new UserId(params.userId)
      );

      if (canvasViewResult.isError()) {
        console.error(`❌ [duplicatePageWithCanvas] Failed to load source canvas: ${canvasViewResult.error.message}`);
        // 캔버스 데이터 로드 실패해도 페이지는 복제되었으므로 성공으로 반환
      } else {
        const { blocks: sourceBlocks, edges: sourceEdges } = canvasViewResult.value;
        const blockMountIdMap = new Map<string, string>();
        const userIdVO = new UserId(params.userId);
        const workspaceIdVO = originalPage.workspaceId;

        // 8-1. 블록 복제
        for (const block of sourceBlocks) {
          const createRequest: CreateAndMountBlockRequest = {
            pageId: newPageId,
            blockType: block.blockType,
            position: {
              x: block.position.x,
              y: block.position.y,
            },
            size: {
              width: block.size.width,
              height: block.size.height,
            },
            title: block.title,
            initialProperties: block.properties,
            initialContent: block.content,
            viewMode: block.viewMode,
          };

          const createResult = await createAndMountBlock(
            createRequest,
            userIdVO,
            workspaceIdVO,
            blockRepo,
            blockMountRepo
          );

          if (createResult.isError()) {
            console.error(`❌ [duplicatePageWithCanvas] Failed to duplicate block: ${createResult.error.message}`);
            continue;
          }

          const newBlockMountId = createResult.value.blockMountAggregate.getBlockMount().id.value;
          blockMountIdMap.set(block.blockMountId, newBlockMountId);
        }

        // 8-2. 엣지 복제
        for (const edge of sourceEdges) {
          const newSourceId = blockMountIdMap.get(edge.sourceBlockMountId);
          const newTargetId = blockMountIdMap.get(edge.targetBlockMountId);

          if (!newSourceId || !newTargetId) {
            continue;
          }

          const edgeRequest: CreateEdgeRequest = {
            pageId: newPageId,
            sourceBlockMountId: newSourceId,
            targetBlockMountId: newTargetId,
            sourceHandle: edge.sourceHandle as 'left' | 'right' | 'top' | 'bottom',
            targetHandle: edge.targetHandle as 'left' | 'right' | 'top' | 'bottom',
          };

          const edgeResult = await createEdge(
            edgeRequest,
            userIdVO,
            blockMountRepo,
            edgeRepo
          );

          if (edgeResult.isError()) {
            console.warn(`⚠️ [duplicatePageWithCanvas] Failed to duplicate edge: ${edgeResult.error.message}`);
          }
        }
      }

      // 8. 도메인 이벤트 처리
      const events = duplicatedPageAgg.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 9. 이벤트 커밋
      duplicatedPageAgg.markEventsAsCommitted();

      // 10. Aggregate 반환
      return R.ok(duplicatedPageAgg);
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
   * 도메인 이벤트 처리 (비동기 병렬 처리)
   *
   * @param events - 처리할 도메인 이벤트 목록
   */
  private async handleDomainEvents(events: Array<any>): Promise<void> {
    const results = await Promise.allSettled(
      events
        .filter(event => this.isPageLifecycleEvent(event))
        .map(async event => {
          if (event.type === 'PageDeleted') {
            return await this.handlePageDeleted(event);
          } else if (event.type === 'PageDuplicated') {
            return await this.handlePageDuplicated(event);
          }
        })
    );

    // 실패한 이벤트 로깅
    const failures = results.filter(
      result => result.status === 'rejected'
    ) as PromiseRejectedResult[];

    if (failures.length > 0) {
      console.warn(
        `[PageLifecycleService] ${failures.length} event handler(s) failed:`,
        failures.map(f => f.reason)
      );
    }
  }

  /**
   * 이벤트 타입 체크
   */
  private isPageLifecycleEvent(event: any): boolean {
    return event.type === 'PageDeleted' || event.type === 'PageDuplicated';
  }

  /**
   * Policy: 페이지가 삭제되었을 때
   */
  private async handlePageDeleted(event: PageDeletedEvent): Promise<void> {
    console.log('[Page Lifecycle] Page Deleted:', {
      type: event.type,
      pageId: event.pageId,
      workspaceId: event.workspaceId,
      occurredAt: event.occurredAt,
    });

    // Policy 구현 예시:
    // - 삭제 통계 업데이트
    // - 하위 페이지 연쇄 삭제 (필요시)
    // - 휴지통 관리
  }

  /**
   * Policy: 페이지가 복제되었을 때
   */
  private async handlePageDuplicated(
    event: PageDuplicatedEvent
  ): Promise<void> {
    console.log('[Page Lifecycle] Page Duplicated:', {
      type: event.type,
      originalPageId: event.originalPageId,
      newPageId: event.newPageId,
      newTitle: event.newTitle,
      occurredAt: event.occurredAt,
    });

    // Policy 구현 예시:
    // - 복제 통계 업데이트
    // - 사용자 활동 추적
    // - 워크스페이스별 페이지 수 증가
  }
}
