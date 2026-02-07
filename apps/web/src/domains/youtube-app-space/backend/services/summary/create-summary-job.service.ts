/**
 * Create Summary Job Service
 *
 * Enqueues a summary job: create aggregate, save, send message to queue,
 * update pgmq_msg_id.
 */
import { Result } from '@/utils/result';

import type { IQueueAdapter } from '@/domains/queue';
import { SummaryJobAggregate } from '../../../shared/aggregates/summary-job.aggregate';
import type { ISummaryJobRepository } from '../../repositories/interfaces/summary-job.repository.interface';

const SUMMARY_QUEUE_NAME = 'summary_queue';

export interface CreateSummaryJobSafeDto {
  blockId: string;
  orgId: string;
  youtubeId: string;
  language: string;
}

/**
 * Create a summary job (aggregate + save + queue + update msg id).
 */
export async function createSummaryJobService(
  safeDto: CreateSummaryJobSafeDto,
  summaryJobRepository: ISummaryJobRepository,
  queueAdapter: IQueueAdapter
): Promise<Result<{ jobId: string }, Error>> {
  try {
    const language = safeDto.language || 'en';

    const aggregate = SummaryJobAggregate.createSummaryJob({
      blockId: safeDto.blockId,
      orgId: safeDto.orgId,
      youtubeId: safeDto.youtubeId,
      language,
    });
    const { id: jobId } = await summaryJobRepository.save(aggregate);

    const msgId = await queueAdapter.send(
      SUMMARY_QUEUE_NAME,
      {
        jobId,
        blockId: safeDto.blockId,
        youtubeId: safeDto.youtubeId,
        language,
      },
      { delaySeconds: 0 }
    );

    if (msgId != null) {
      await summaryJobRepository.updatePgmqMsgId(jobId, Number(msgId));
    }

    return Result.success({ jobId });
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
