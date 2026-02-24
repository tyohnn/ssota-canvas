'use server';

import { createClient } from '@supabase/supabase-js';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { createSupabasePgmqQueueAdapter } from '@/domains/queue';

import { DrizzleSourceJobRepository } from '../../backend/repositories/implementations/drizzle-source-job.repository';
import { DrizzleSourceSummaryRepository } from '../../backend/repositories/implementations/drizzle-source-summary.repository';
import { ensureSourceJobService } from '../../backend/services/source-job';
import { BlockSlugParamSchema } from '../../shared/dtos/requests/source.requests';
import type { SourceBlockActionContext } from '../secure-action';
import { withSourceBlockSecureAction } from '../secure-action';

const ExtractSourceContentByBlockRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugParamSchema,
});
type ExtractSourceContentByBlockRequest = z.infer<
  typeof ExtractSourceContentByBlockRequestSchema
>;

export const extractSourceContentAction = withSourceBlockSecureAction(
  ExtractSourceContentByBlockRequestSchema,
  'extractSourceContentAction',
  extractSourceContentInternal
);

async function extractSourceContentInternal(
  req: ExtractSourceContentByBlockRequest,
  ctx: SourceBlockActionContext
): Promise<ActionResult<{ ok: true; jobId: string; alreadyExists: boolean }>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const queueAdapter = createSupabasePgmqQueueAdapter({ supabase });

  const result = await ensureSourceJobService(
    {
      blockId: ctx.blockUuid,
      orgId: ctx.organization.id,
      sourceId: ctx.sourceId,
      language: 'en',
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
