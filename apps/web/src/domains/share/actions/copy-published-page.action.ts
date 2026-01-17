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
import { copyPageToWorkspace } from '@/domains/workspace-management/backend/services/copy-page.service';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';

import { DrizzlePublishedPageRepository } from '../backend/repositories/implementations/drizzle-published-page.repository';
import { PublishToken } from '../shared/value-objects/publish-token.vo';
import { ShareManagementError } from '../shared/errors/share-management.error';
import {
  CopyPublishedPageRequest,
  CopyPublishedPageRequestSchema,
} from '../shared/dtos/request';
import { CopyResultDTO } from '../shared/dtos/response';
import { withShareAuthenticatedAction } from './secure-action';

/**
 * 게시된 페이지 복제 Action
 * 인증된 사용자가 publishToken으로 게시된 페이지를 복제
 */
export const copyPublishedPageAction = withShareAuthenticatedAction(
  CopyPublishedPageRequestSchema,
  'copyPublishedPageAction',
  copyPublishedPageInternal,
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
 * ✅ Event Storming + DDD 패턴:
 * - Service에 SafeDTO 전달 (Command 변환은 Service 내부에서 수행)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param safeDto - 검증된 요청 데이터 (Zod Schema로 검증됨)
 * @param context - 검증된 컨텍스트 정보
 *   - context.authenticatedUser: 인증된 사용자 정보 (id, profile)
 */
async function copyPublishedPageInternal(
  safeDto: CopyPublishedPageRequest,
  context: { authenticatedUser: { id: string; profile: any } }
): Promise<ActionResult<CopyResultDTO>> {
  try {
    // 1. PublishedPage 조회
    const publishedPageRepository = new DrizzlePublishedPageRepository();
    const publishToken = new PublishToken(safeDto.publishToken);
    const publishedPage = await publishedPageRepository.findByToken(publishToken);

    if (!publishedPage) {
      return err('Link not found', {
        code: 'PUBLISH_LINK_NOT_FOUND',
      });
    }

    // 2. Workspace 도메인의 copyPageToWorkspace 서비스 직접 사용
    const pageRepository = new DrizzlePageRepository();
    const copyResult = await copyPageToWorkspace(
      publishedPage.pageId,
      safeDto.targetWorkspaceId,
      context.authenticatedUser.id,
      pageRepository
    );

    // 3. Result 처리 및 DTO 변환
    if (!copyResult.success) {
      return ok({
        copiedPageId: '',
        targetWorkspaceId: safeDto.targetWorkspaceId,
        status: 'failed',
        errorMessage: copyResult.error,
      });
    }

    return ok({
      copiedPageId: copyResult.data,
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

    console.error('[copyPublishedPageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
