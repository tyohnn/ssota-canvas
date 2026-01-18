/**
 * 게시된 페이지 조회 Action (공개)
 *
 * ⚠️ Security: 인증 불필요 (publishToken만 검증)
 * - publishToken으로 게시된 페이지 조회
 * - 공개 페이지이므로 인증 없이 접근 가능
 */

'use server';

import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-viewport.repository';
import { CanvasQueryService } from '@/domains/canvas-management/backend/services/canvas-query.service';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzlePublishedPageRepository } from '../backend/repositories/implementations/drizzle-published-page.repository';
import { GetPublishedPageRequestSchema } from '../shared/dtos/request';
import { PublishedPageViewDTO } from '../shared/dtos/response';
import { PublishToken } from '../shared/value-objects/publish-token.vo';

/**
 * 게시된 페이지 조회 Action (공개)
 *
 * ⚠️ Security: Trust Boundary - unknown + Zod 검증
 * - publishToken만 검증 (인증 불필요)
 */
export async function getPublishedPageAction(
  input: unknown
): Promise<ActionResult<PublishedPageViewDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = GetPublishedPageRequestSchema.safeParse(input);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to getPublishedPageAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const publishToken = parseResult.data;

  // 3. Internal 함수 호출 (인증 불필요)
  return await getPublishedPageInternal(publishToken);
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 검증된 publishToken만 받습니다
 *
 * @param publishToken - 검증된 publish token
 */
async function getPublishedPageInternal(
  publishToken: string
): Promise<ActionResult<PublishedPageViewDTO>> {
  try {
    // 1. Repository 생성
    const publishedPageRepository = new DrizzlePublishedPageRepository();
    const pageRepository = new DrizzlePageRepository();
    const canvasQueryService = new CanvasQueryService(
      new DrizzleBlockMountRepository(),
      new DrizzleEdgeRepository(),
      new DrizzleViewportRepository()
    );

    // 2. PublishedPage 조회
    const publishedPage = await publishedPageRepository.findByToken(
      new PublishToken(publishToken)
    );

    if (!publishedPage || publishedPage.status !== 'published') {
      return err('Link not found', {
        code: 'PUBLISH_LINK_NOT_FOUND',
      });
    }

    // 3. Page 조회 (title, icon을 위해)
    const page = await pageRepository.findById(
      new PageId(publishedPage.pageId)
    );

    // 4. Canvas 데이터 조회 (CanvasQueryService 직접 사용)
    const canvasResult = await canvasQueryService.getCanvasView(
      new PageId(publishedPage.pageId),
      new UserId(publishedPage.ownerId)
    );

    if (canvasResult.isError()) {
      return err('Failed to load published page', {
        code: 'PUBLISH_LINK_NOT_FOUND',
      });
    }

    const canvasView = canvasResult.value;

    // 5. Response DTO 생성 (CanvasViewData 확장)
    const result: PublishedPageViewDTO = {
      ...canvasView,
      title: page?.title ?? 'Untitled',
      icon: page?.icon ?? undefined,
    };

    return ok(result);
  } catch (error) {
    console.error('[getPublishedPageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        publishToken,
      },
    });
  }
}
