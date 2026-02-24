/**
 * 진행 중인 Source Job 조회 Action (Block 기준)
 *
 * 에디터 패널 재오픈 시 useSourceJobRealtime의 initialJob으로 사용.
 * Realtime 구독 전 현재 job 상태를 즉시 반영.
 */

'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleSourceJobRepository } from '../../backend/repositories/implementations/drizzle-source-job.repository';
import { getInProgressSourceJobByBlockIdService } from '../../backend/services/source-job';
import { withSourceBlockSecureAction } from '../secure-action';
import {
  GetInProgressSourceJobByBlockIdRequestSchema,
  type GetInProgressSourceJobByBlockIdRequest,
} from '../../shared/dtos/requests';
import type { GetInProgressSourceJobByBlockIdDTO } from '../../shared/dtos/responses';
import type { SourceBlockActionContext } from '../secure-action';

export const getInProgressSourceJobByBlockIdAction =
  withSourceBlockSecureAction(
    GetInProgressSourceJobByBlockIdRequestSchema,
    'getInProgressSourceJobByBlockId',
    getInProgressSourceJobByBlockIdInternal
  );

async function getInProgressSourceJobByBlockIdInternal(
  _safeDto: GetInProgressSourceJobByBlockIdRequest,
  ctx: SourceBlockActionContext
): Promise<ActionResult<GetInProgressSourceJobByBlockIdDTO>> {
  const sourceJobRepository = new DrizzleSourceJobRepository();
  const result = await getInProgressSourceJobByBlockIdService(ctx.blockUuid, {
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
