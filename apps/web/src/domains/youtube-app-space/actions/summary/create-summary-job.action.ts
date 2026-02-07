'use server';

import { createClient } from '@supabase/supabase-js';

import {
  createSupabasePgmqQueueAdapter,
  type IQueueAdapter,
} from '@/domains/queue';
import { ActionResult, err, ok } from '@/lib';
import { DrizzleSummaryJobRepository } from '../../backend/repositories/implementations/drizzle-summary-job.repository';
import type { ISummaryJobRepository } from '../../backend/repositories/interfaces/summary-job.repository.interface';
import {
  createSummaryJobService,
  type CreateSummaryJobSafeDto,
} from '../../backend/services/summary';

export interface CreateSummaryJobRequest {
  blockId: string;
  orgId: string;
  youtubeId: string;
  language: string;
}

/**
 * Create a summary job (queue + summary_jobs state) for auto summary flow.
 * Call after YouTube block metadata is fetched successfully.
 */
export async function createSummaryJobAction(
  request: CreateSummaryJobRequest
): Promise<ActionResult<{ jobId: string }>> {
  const { blockId, orgId, youtubeId, language } = request;

  if (!blockId || !orgId || !youtubeId) {
    return err('blockId, orgId, and youtubeId are required');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const summaryJobRepository: ISummaryJobRepository =
    new DrizzleSummaryJobRepository();
  const queueAdapter: IQueueAdapter = createSupabasePgmqQueueAdapter({
    supabase,
  });

  const safeDto: CreateSummaryJobSafeDto = {
    blockId,
    orgId,
    youtubeId,
    language: language ?? 'en',
  };

  const result = await createSummaryJobService(
    safeDto,
    summaryJobRepository,
    queueAdapter
  );

  if (result.isError()) {
    console.error('[createSummaryJobAction] Error:', result.error);
    return err(
      result.error instanceof Error ? result.error.message : 'Unknown error'
    );
  }

  return ok({ jobId: result.value.jobId });
}
