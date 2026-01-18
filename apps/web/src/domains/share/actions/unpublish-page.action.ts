/**
 * 페이지 게시 취소 Action
 *
 * 패턴: withSharePageSecureAction HOF 사용
 *
 * ⚠️ Security: withSharePageSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Page 접근 권한 확인
 * 4. Workspace 접근 권한 확인
 */

'use server';

import type { PageActionContext } from '@/domains/common/auth/types';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzlePublishedPageRepository } from '../backend/repositories/implementations/drizzle-published-page.repository';
import { unpublishPage } from '../backend/services';
import {
  UnpublishPageRequest,
  UnpublishPageRequestSchema,
} from '../shared/dtos/request';
import { withSharePageSecureAction } from './secure-action';

/**
 * 페이지 게시 취소 Action
 * 해당 페이지가 속한 워크스페이스, 조직에 대한 권한이 있는지 확인
 */
export const unpublishPageAction = withSharePageSecureAction(
  UnpublishPageRequestSchema,
  'unpublishPageAction',
  unpublishPageInternal,
  {
    getLogMetadata: req => ({
      pageId: req.pageId,
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
 * - Page 접근 권한 검증 완료
 * - Workspace 접근 권한 검증 완료
 *
 * @param safeDto - 검증된 요청 데이터 (Zod Schema로 검증됨)
 * @param context - 검증된 컨텍스트 정보
 *   - context.authenticatedUser: 인증된 사용자 정보 (id, profile)
 *   - context.workspace: 검증된 워크스페이스 엔티티
 *   - context.organization: 조직 정보 (id, role)
 *   - context.page: 검증된 페이지 엔티티
 */
async function unpublishPageInternal(
  safeDto: UnpublishPageRequest,
  context: PageActionContext
): Promise<ActionResult<void>> {
  try {
    // 1. Repository 생성
    const repository = new DrizzlePublishedPageRepository();

    // 2. Service Function을 통한 페이지 게시 취소 (SafeDTO 전달)
    const safeUserId = new UserId(context.authenticatedUser.id);
    const result = await unpublishPage(safeDto, safeUserId, repository);

    // 3. Result 처리
    if (result.isError()) {
      return err(String(result.error), {
        code: 'UNPUBLISH_PAGE_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 4. 성공 반환
    return ok(undefined);
  } catch (error) {
    console.error('[unpublishPageInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
