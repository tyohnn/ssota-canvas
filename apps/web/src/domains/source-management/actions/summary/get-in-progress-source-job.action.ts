/**
 * 진행 중인 Source Job 조회 Action (페이지 기준)
 *
 * 패턴: Page-scoped secure action
 * - pageId만 전달, authorizeByPageId로 검증 후 서비스 호출
 * - 새로고침 시 Status 창 복원용 (source_jobs)
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

import { DrizzleSourceJobRepository } from '../../backend/repositories/implementations/drizzle-source-job.repository';
import { getInProgressSourceJobsByPageIdService } from '../../backend/services/source-job';
import {
  GetInProgressSourceJobRequestSchema,
  type GetInProgressSourceJobRequest,
} from '../../shared/dtos/requests';
import type { GetInProgressSourceJobDTO } from '../../shared/dtos/responses';

type TempPageContext = {
  isTempPage: true;
  authenticatedUser: AuthenticatedUser;
};

const getInProgressSourceJobSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser)
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

export const getInProgressSourceJobAction =
  getInProgressSourceJobSecureActionBuilder(
    GetInProgressSourceJobRequestSchema,
    'getInProgressSourceJob',
    getInProgressSourceJobInternal,
    { getLogMetadata: safeDto => ({ pageId: safeDto.pageId }) }
  );

async function getInProgressSourceJobInternal(
  safeDto: GetInProgressSourceJobRequest,
  context: PageActionContext | TempPageContext
): Promise<ActionResult<GetInProgressSourceJobDTO>> {
  if ('isTempPage' in context && context.isTempPage) {
    return ok({ jobs: [] });
  }

  const pageId = (context as PageActionContext).page.pageId.value;
  const sourceJobRepository = new DrizzleSourceJobRepository();

  const result = await getInProgressSourceJobsByPageIdService(pageId, {
    sourceJobRepository,
  });

  if (result.isError()) {
    console.error('[getInProgressSourceJobInternal] Error:', result.error);
    return err(result.error.message, {
      code: 'QUERY_FAILED',
      meta: { originalError: result.error },
    });
  }

  return ok(result.value);
}
