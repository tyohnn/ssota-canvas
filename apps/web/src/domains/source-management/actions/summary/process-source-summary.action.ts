'use server';

import { ActionResult, err, ok } from '@/lib';

import { createSupabasePgmqQueueAdapter } from '@/domains/queue';
import { supabaseAdmin } from '@/utils/supabase/server';

import { DrizzleSourceJobRepository } from '../../backend/repositories/implementations/drizzle-source-job.repository';
import { DrizzleSourceSummaryRepository } from '../../backend/repositories/implementations/drizzle-source-summary.repository';
import { ensureSourceJobService } from '../../backend/services/source-job';
import {
  ProcessSourceSummaryByBlockRequestSchema,
  type ProcessSourceSummaryByBlockRequest,
} from '../../shared/dtos/requests';
import type { SourceBlockActionContext } from '../secure-action';
import { withSourceBlockSecureAction } from '../secure-action';

export const processSourceSummaryAction = withSourceBlockSecureAction(
  ProcessSourceSummaryByBlockRequestSchema,
  'processSourceSummaryAction',
  processSourceSummaryInternal
);

async function processSourceSummaryInternal(
  req: ProcessSourceSummaryByBlockRequest,
  ctx: SourceBlockActionContext
): Promise<
  ActionResult<{
    ok: true;
    jobId: string;
    alreadyExists: boolean;
    blockUuid: string;
  }>
> {
  // 1. Supabase admin client + PGMQ queue adapter 준비
  const queueAdapter = createSupabasePgmqQueueAdapter({ supabase: supabaseAdmin });

  // 2. ensureSourceJobService: 기존 job 있으면 반환, 없으면 source_summary 생성 후 extract 큐에 메시지 enqueue
  const result = await ensureSourceJobService(
    {
      blockId: ctx.blockUuid,
      orgId: ctx.organization.id,
      sourceId: ctx.sourceId,
      language: req.language,
    },
    {
      sourceSummaryRepository: new DrizzleSourceSummaryRepository(),
      sourceJobRepository: new DrizzleSourceJobRepository(),
      queueAdapter,
    }
  );

  // 3. 실패 시 에러 반환
  if (result.isError()) {
    return err(result.error.message, {
      code: 'ENSURE_SOURCE_JOB_FAILED',
      meta: { originalError: result.error },
    });
  }

  // 4. 성공 시 jobId, alreadyExists, blockUuid 반환
  return ok({
    ok: true,
    jobId: result.value.jobId,
    alreadyExists: result.value.alreadyExists,
    blockUuid: ctx.blockUuid,
  });
}
