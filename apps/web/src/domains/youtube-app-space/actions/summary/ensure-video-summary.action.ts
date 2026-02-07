'use server';

import { createClient } from '@supabase/supabase-js';

import {
  createSupabasePgmqQueueAdapter,
  type IQueueAdapter,
} from '@/domains/queue';
import { ActionResult, err, ok } from '@/lib';
import { DrizzleSummaryJobRepository } from '../../backend/repositories/implementations/drizzle-summary-job.repository';
import type { ISummaryJobRepository } from '../../backend/repositories/interfaces/summary-job.repository.interface';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import { DrizzleVideoSummaryRepository } from '../../backend/repositories/implementations/drizzle-video-summary.repository';
import {
  ensureVideoSummaryService,
  type EnsureVideoSummarySafeDto,
} from '../../backend/services/summary';
import {
  type ExtractVideoSummaryRequest,
  ExtractVideoSummaryRequestSchema,
} from '../../shared/dtos/requests/video-summary.requests';
import {
  type YoutubeBlockActionContext,
  withYoutubeBlockSecureAction,
} from '../secure-action';

export interface EnsureVideoSummaryDTO {
  jobId: string;
  alreadyExists: boolean;
}

/**
 * Ensure video summary for (block, language). If summary exists, marks job completed;
 * otherwise enqueues. Replaces direct extract for Realtime status tracking.
 */
export const ensureVideoSummaryAction = withYoutubeBlockSecureAction(
  ExtractVideoSummaryRequestSchema,
  'ensureVideoSummaryAction',
  ensureVideoSummaryInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
      youtubeId: req.youtubeId,
      language: req.language,
    }),
  }
);

async function ensureVideoSummaryInternal(
  safeDto: ExtractVideoSummaryRequest,
  context: YoutubeBlockActionContext
): Promise<ActionResult<EnsureVideoSummaryDTO>> {
  const videoRepository = new DrizzleVideoRepository();
  const videoAggregate = await videoRepository.findById(safeDto.youtubeId);
  if (!videoAggregate) {
    return err('Video not found', { code: 'VIDEO_NOT_FOUND' });
  }
  const slug = videoAggregate.getVideo().slug.value;

  const summaryJobRepository: ISummaryJobRepository =
    new DrizzleSummaryJobRepository();
  const videoSummaryRepository = new DrizzleVideoSummaryRepository();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const queueAdapter: IQueueAdapter = createSupabasePgmqQueueAdapter({
    supabase,
  });

  const dto: EnsureVideoSummarySafeDto = {
    blockId: safeDto.blockId,
    orgId: context.organization.id,
    youtubeId: slug,
    language: safeDto.language ?? 'en',
  };

  const result = await ensureVideoSummaryService(dto, {
    summaryJobRepository,
    videoSummaryRepository,
    videoRepository,
    queueAdapter,
  });

  if (result.isError()) {
    return err(result.error.message, {
      code: 'ENSURE_SUMMARY_FAILED',
      meta: { originalError: result.error },
    });
  }

  return ok({
    jobId: result.value.jobId,
    alreadyExists: result.value.alreadyExists,
  });
}
