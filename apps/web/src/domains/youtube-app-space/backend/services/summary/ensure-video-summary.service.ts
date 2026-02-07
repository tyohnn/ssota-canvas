/**
 * Ensure Video Summary Service
 *
 * Ensures a summary exists for (video, language): if it does, saves summary_jobs
 * as completed for Realtime UI; otherwise enqueues a job. Uses injected repositories
 * and queue adapter.
 */
import { Result } from '@/utils/result';

import type { IQueueAdapter } from '@/domains/queue';
import { SummaryJobAggregate } from '../../../shared/aggregates/summary-job.aggregate';
import type { ISummaryJobRepository } from '../../repositories/interfaces/summary-job.repository.interface';
import type { IVideoRepository } from '../../repositories/interfaces/video.repository.interface';
import type { IVideoSummaryRepository } from '../../repositories/interfaces/video-summary.repository.interface';
import { createSummaryJobService } from './create-summary-job.service';

export interface EnsureVideoSummarySafeDto {
  blockId: string;
  orgId: string;
  youtubeId: string; // slug (11-char YouTube ID)
  language: string;
}

export interface EnsureVideoSummaryDeps {
  summaryJobRepository: ISummaryJobRepository;
  videoSummaryRepository: IVideoSummaryRepository;
  videoRepository: IVideoRepository;
  queueAdapter: IQueueAdapter;
}

/**
 * Ensure video summary for (block, language). If summary already exists, save
 * summary_jobs as completed; otherwise enqueue and return jobId.
 */
export async function ensureVideoSummaryService(
  safeDto: EnsureVideoSummarySafeDto,
  deps: EnsureVideoSummaryDeps
): Promise<Result<{ jobId: string; alreadyExists: boolean }, Error>> {
  const {
    summaryJobRepository,
    videoSummaryRepository,
    videoRepository,
    queueAdapter,
  } = deps;

  try {
    const language = safeDto.language || 'en';

    const videoAggregate = await videoRepository.findBySlug(safeDto.youtubeId);
    if (!videoAggregate) {
      return Result.error(new Error('Video not found for slug: ' + safeDto.youtubeId));
    }
    const videoId = videoAggregate.getVideo().id.value;

    const existingSummary = await videoSummaryRepository.findByVideoIdAndLanguage(
      videoId,
      language
    );

    if (existingSummary) {
      const aggregate = SummaryJobAggregate.createCompletedSummaryJob({
        blockId: safeDto.blockId,
        orgId: safeDto.orgId,
        youtubeId: safeDto.youtubeId,
        language,
      });
      const { id: jobId } = await summaryJobRepository.save(aggregate);
      return Result.success({ jobId, alreadyExists: true });
    }

    const createResult = await createSummaryJobService(
      {
        blockId: safeDto.blockId,
        orgId: safeDto.orgId,
        youtubeId: safeDto.youtubeId,
        language,
      },
      summaryJobRepository,
      queueAdapter
    );

    if (createResult.isError()) {
      return Result.error(createResult.error);
    }
    return Result.success({
      jobId: createResult.value.jobId,
      alreadyExists: false,
    });
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
