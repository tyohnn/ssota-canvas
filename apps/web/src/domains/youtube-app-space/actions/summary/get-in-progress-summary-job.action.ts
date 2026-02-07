/**
 * 진행 중인 Summary Job 조회 Action (페이지 기준)
 *
 * 패턴: Page-scoped secure action (canvas-query.actions.ts와 동일)
 * - pageId만 전달, authorizeByPageId로 검증 후 서비스 호출
 * - 서비스 → 레포지토리 레이어 사용 (DB 직접 노출 없음)
 * - 새로고침 시 Status 창 복원용
 */

'use server';

import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import {
  authorizeByPageId,
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { PageActionContext } from '@/domains/common/auth/types';
import { isTempPageId } from '@/domains/workspace-management/shared/utils/temp-page-id.utils';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleSummaryJobRepository } from '../../backend/repositories/implementations/drizzle-summary-job.repository';
import {
  getInProgressSummaryJobService,
} from '../../backend/services/summary';
import type { GetInProgressSummaryJobDTO } from '../../shared/dtos/responses/video-summary.responses';
import {
  GetInProgressSummaryJobRequestSchema,
  type GetInProgressSummaryJobRequest,
} from '../../shared/dtos/requests/video-summary.requests';

type TempPageContext = {
  isTempPage: true;
  authenticatedUser: AuthenticatedUser;
};

const getInProgressSecureActionBuilder = createSecureActionBuilder<AuthenticatedUser>(
  getAuthenticatedUser
)
  .forContext<PageActionContext | TempPageContext>()
  .withAuth(
    (req: { pageId: string }, user: AuthenticatedUser) =>
      isTempPageId(req.pageId)
        ? Promise.resolve({
            success: true as const,
            context: { isTempPage: true as const, authenticatedUser: user },
          })
        : authorizeByPageId(req.pageId, user.id)
  )
  .build();

export const getInProgressSummaryJobAction = getInProgressSecureActionBuilder(
  GetInProgressSummaryJobRequestSchema,
  'getInProgressSummaryJob',
  getInProgressSummaryJobHandler,
  { getLogMetadata: req => ({ pageId: req.pageId }) }
);

async function getInProgressSummaryJobHandler(
  req: GetInProgressSummaryJobRequest,
  context: PageActionContext | TempPageContext
): Promise<ActionResult<GetInProgressSummaryJobDTO>> {
  if ('isTempPage' in context && context.isTempPage) {
    return ok({ jobs: [] });
  }

  const pageId = (context as PageActionContext).page.pageId.value;
  const summaryJobRepository = new DrizzleSummaryJobRepository();

  const result = await getInProgressSummaryJobService(pageId, {
    summaryJobRepository,
  });

  if (result.isError()) {
    console.error('[getInProgressSummaryJobHandler] Error:', result.error);
    return err(result.error.message, {
      code: 'QUERY_FAILED',
      meta: { originalError: result.error },
    });
  }

  return ok(result.value);
}
