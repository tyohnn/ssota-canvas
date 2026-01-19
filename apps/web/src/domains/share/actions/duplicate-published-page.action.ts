/**
 * 게시된 페이지 복제 Action
 *
 * 패턴: withShareAuthenticatedAction HOF 사용
 *
 * ⚠️ Security: withShareAuthenticatedAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 */

'use server';

import { ActionResult, err, ok } from '@/lib';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageAggregate } from '@/domains/workspace-management/shared/aggregates/page.aggregate';
import { Page } from '@/domains/workspace-management/shared/entities/page.entity';
import { CanvasQueryService } from '@/domains/canvas-management/backend/services/canvas-query.service';
import { createAndMountBlock } from '@/domains/canvas-management/backend/services/block-mount';
import { createEdge } from '@/domains/canvas-management/backend/services/edge';
import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-viewport.repository';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import type { CreateAndMountBlockRequest } from '@/domains/canvas-management/shared/dtos/requests';
import type { CreateEdgeRequest } from '@/domains/canvas-management/shared/dtos/requests/edge.requests';
import { generateKeyBetween } from 'fractional-indexing';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace-member.repository';

import { DrizzlePublishedPageRepository } from '../backend/repositories/implementations/drizzle-published-page.repository';
import { ShareManagementError } from '../shared/errors/share-management.error';
import {
  DuplicatePublishedPageRequest,
  DuplicatePublishedPageRequestSchema,
} from '../shared/dtos/request';
import { DuplicateResultDTO } from '../shared/dtos/response';
import { PublishToken } from '../shared/value-objects/publish-token.vo';
import { withShareAuthenticatedAction } from './secure-action';

/**
 * 게시된 페이지 복제 Action
 * 인증된 사용자가 publishToken으로 게시된 페이지를 복제
 */
export const duplicatePublishedPageAction = withShareAuthenticatedAction(
  DuplicatePublishedPageRequestSchema,
  'duplicatePublishedPageAction',
  duplicatePublishedPageInternal,
  {
    getLogMetadata: req => ({
      publishToken: req.publishToken,
      targetWorkspaceId: req.targetWorkspaceId,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ✅ Application Layer에서 직접 orchestrate
 * - publishToken으로 PublishedPage 조회
 * - 원본 Page 조회
 * - 타겟 워크스페이스 멤버십 확인
 * - 새 페이지 생성 및 저장
 * - 캔버스 데이터 복제
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param safeDto - 검증된 요청 데이터 (Zod Schema로 검증됨)
 * @param context - 검증된 컨텍스트 정보
 *   - context.authenticatedUser: 인증된 사용자 정보 (id, profile)
 */
async function duplicatePublishedPageInternal(
  safeDto: DuplicatePublishedPageRequest,
  context: { authenticatedUser: { id: string; profile: any } }
): Promise<ActionResult<DuplicateResultDTO>> {
  try {
    const safeUserId = new UserId(context.authenticatedUser.id);

    // 1. PublishedPage 조회
    const publishedPageRepository = new DrizzlePublishedPageRepository();
    const publishToken = new PublishToken(safeDto.publishToken);
    const publishedPage = await publishedPageRepository.findByToken(publishToken);

    if (!publishedPage || publishedPage.status !== 'published') {
      return err('Link not found', {
        code: 'PUBLISH_LINK_NOT_FOUND',
      });
    }

    // 2. 원본 Page 조회
    const pageRepository = new DrizzlePageRepository();
    const originalPage = await pageRepository.findById(
      new PageId(publishedPage.pageId)
    );
    if (!originalPage) {
      return err('Page not found', {
        code: 'PUBLISH_LINK_NOT_FOUND',
      });
    }

    // 3. 타겟 워크스페이스 멤버십 확인 (공유 게시 페이지 복제 시 필수)
    const workspaceMemberRepository = new DrizzleWorkspaceMemberRepository();
    const targetWorkspaceIdVO = new WorkspaceId(safeDto.targetWorkspaceId);
    const isTargetMember = await workspaceMemberRepository.isMember(
      targetWorkspaceIdVO,
      safeUserId.value
    );
    if (!isTargetMember) {
      return err('Not a member of target workspace', {
        code: 'WORKSPACE_FORBIDDEN',
      });
    }

    // 4. 새 페이지 생성 (외부 워크스페이스로 복제: 부모 없이 루트에 생성)
    const newOrder = generateKeyBetween(null, null);
    const newPageIdVO = new PageId(crypto.randomUUID());
    const newPageEntity = new Page(
      newPageIdVO,
      targetWorkspaceIdVO,
      null, // 부모 없이 루트에 생성
      `${originalPage.title} (Duplicate)`,
      originalPage.icon,
      newOrder,
      0, // 루트 레벨
      safeUserId.value,
      new Date(),
      new Date(),
      null
    );
    const newPage = new PageAggregate(newPageEntity);

    // 5. Page 저장
    await pageRepository.save(newPage);
    const newPageId = newPage.page.pageId.value;

    // 6. 캔버스 데이터 복제
    const blockMountRepo = new DrizzleBlockMountRepository();
    const edgeRepo = new DrizzleEdgeRepository();
    const blockRepo = new DrizzleBlockRepository();
    const viewportRepo = new DrizzleViewportRepository();

    const canvasQueryService = new CanvasQueryService(
      blockMountRepo,
      edgeRepo,
      viewportRepo
    );

    // 원본 캔버스 데이터 조회 (공유 게시 페이지이므로 원본 페이지의 publisherId 사용)
    const originalPageId = new PageId(publishedPage.pageId);
    const originalPublisherId = new UserId(publishedPage.publisherId);
    const canvasViewResult = await canvasQueryService.getCanvasView(
      originalPageId,
      originalPublisherId
    );

    if (canvasViewResult.isError()) {
      console.error(`❌ [duplicatePublishedPage] Failed to load source canvas: ${canvasViewResult.error.message}`);
      // 캔버스 데이터 로드 실패해도 페이지는 복제되었으므로 성공으로 반환
    } else {
      const { blocks: sourceBlocks, edges: sourceEdges } = canvasViewResult.value;
      const blockMountIdMap = new Map<string, string>();

      // 6-1. 블록 복제
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
          safeUserId,
          targetWorkspaceIdVO,
          blockRepo,
          blockMountRepo
        );

        if (createResult.isError()) {
          console.error(`❌ [duplicatePublishedPage] Failed to duplicate block: ${createResult.error.message}`);
          continue;
        }

        const newBlockMountId = createResult.value.blockMountAggregate.getBlockMount().id.value;
        blockMountIdMap.set(block.blockMountId, newBlockMountId);
      }

      // 6-2. 엣지 복제
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
          safeUserId,
          blockMountRepo,
          edgeRepo
        );

        if (edgeResult.isError()) {
          console.warn(`⚠️ [duplicatePublishedPage] Failed to duplicate edge: ${edgeResult.error.message}`);
        }
      }
    }

    // 7. Response DTO 반환
    return ok({
      duplicatedPageId: newPageId,
      targetWorkspaceId: safeDto.targetWorkspaceId,
      status: 'completed',
    });
  } catch (error) {
    // ShareManagementError 처리
    if (error instanceof ShareManagementError) {
      return err(error.message, {
        code: error.code,
      });
    }

    console.error('[duplicatePublishedPageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
