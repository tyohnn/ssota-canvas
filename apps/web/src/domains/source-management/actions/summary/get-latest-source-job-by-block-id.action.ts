/**
 * Latest Source Job 조회 Action (Block 기준, status 무관)
 *
 * AI status 패널 초기 동기화용. 요약이 이미 있으면 Realtime 이벤트 없이
 * completed/failed 상태를 즉시 반영하기 위해 호출.
 */

'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleSourceJobRepository } from '../../backend/repositories/implementations/drizzle-source-job.repository';
import { getLatestSourceJobByBlockIdService } from '../../backend/services/source-job';
import { withSourceBlockSecureAction } from '../secure-action';
import {
  GetInProgressSourceJobByBlockIdRequestSchema,
  type GetInProgressSourceJobByBlockIdRequest,
} from '../../shared/dtos/requests';
import type { GetInProgressSourceJobByBlockIdDTO } from '../../shared/dtos/responses';
import type { SourceBlockActionContext } from '../secure-action';

export const getLatestSourceJobByBlockIdAction = withSourceBlockSecureAction(
  GetInProgressSourceJobByBlockIdRequestSchema,
  'getLatestSourceJobByBlockId',
  getLatestSourceJobByBlockIdInternal
);

async function getLatestSourceJobByBlockIdInternal(
  _safeDto: GetInProgressSourceJobByBlockIdRequest,
  ctx: SourceBlockActionContext
): Promise<ActionResult<GetInProgressSourceJobByBlockIdDTO>> {
  const sourceJobRepository = new DrizzleSourceJobRepository();
  const result = await getLatestSourceJobByBlockIdService(ctx.blockUuid, {
    sourceJobRepository,
  });

  if (result.isError()) {
    return err(result.error.message, {
      code: 'QUERY_FAILED',
      meta: { originalError: result.error },
    });
  }

  return ok({ job: result.value, blockUuid: ctx.blockUuid });
}
