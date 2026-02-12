'use server';

import { createClient } from '@supabase/supabase-js';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { createSupabasePgmqQueueAdapter } from '@/domains/queue';

import { DrizzleSourceJobRepository } from '../../backend/repositories/implementations/drizzle-source-job.repository';
import { DrizzleSourceSummaryRepository } from '../../backend/repositories/implementations/drizzle-source-summary.repository';
import { ensureSourceJobService } from '../../backend/services/source-job';
import { SUPPORTED_LANGUAGES } from '../../shared/value-objects/language-code.vo';
import type { SourceBlockActionContext } from '../secure-action';
import { withSourceBlockSecureAction } from '../secure-action';

const LanguageSchema = z.enum(
  SUPPORTED_LANGUAGES as unknown as [string, ...string[]]
);
const ProcessSourceSummaryByBlockRequestSchema = z.object({
  blockId: z.string().uuid(),
  language: LanguageSchema,
});
type ProcessSourceSummaryByBlockRequest = z.infer<
  typeof ProcessSourceSummaryByBlockRequestSchema
>;

export const processSourceSummaryAction = withSourceBlockSecureAction(
  ProcessSourceSummaryByBlockRequestSchema,
  'processSourceSummaryAction',
  processSourceSummaryInternal
);

async function processSourceSummaryInternal(
  req: ProcessSourceSummaryByBlockRequest,
  ctx: SourceBlockActionContext
): Promise<
  ActionResult<{ ok: true; jobId: string; alreadyExists: boolean }>
> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const queueAdapter = createSupabasePgmqQueueAdapter({ supabase });

  const result = await ensureSourceJobService(
    {
      blockId: req.blockId,
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

  if (result.isError()) {
    return err(result.error.message, {
      code: 'ENSURE_SOURCE_JOB_FAILED',
      meta: { originalError: result.error },
    });
  }

  return ok({
    ok: true,
    jobId: result.value.jobId,
    alreadyExists: result.value.alreadyExists,
  });
}
