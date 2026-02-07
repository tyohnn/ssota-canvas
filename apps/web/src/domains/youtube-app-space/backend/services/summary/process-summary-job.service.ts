/**
 * Process Summary Job Service
 *
 * 큐에서 꺼낸 summary job 한 건 처리: job 조회 → 요약 추출/갱신 → 완료/실패 반영.
 * Application(route) 레이어는 이 서비스만 호출하고, 레포/블록 등 의존성은 deps로 주입.
 */
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import type { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties';
import { extractAndUpdateSummary } from '../video-summary';
import type { IActionTransactionRepository } from '../../repositories/interfaces/action-transaction.repository.interface';
import type { ISummaryJobRepository } from '../../repositories/interfaces/summary-job.repository.interface';
import type { IVideoRepository } from '../../repositories/interfaces/video.repository.interface';
import type { IVideoSummaryRepository } from '../../repositories/interfaces/video-summary.repository.interface';

export interface ProcessSummaryJobInput {
  jobId: string;
  msgId?: number;
}

export interface ProcessSummaryJobDeps {
  summaryJobRepository: ISummaryJobRepository;
  blockRepository: IBlockRepository;
  videoRepository: IVideoRepository;
  videoSummaryRepository: IVideoSummaryRepository;
  actionTransactionRepository: IActionTransactionRepository;
  archiveQueueMessage: (msgId: number) => Promise<void>;
  deleteQueueMessage: (msgId: number) => Promise<void>;
}

export type ProcessSummaryJobResult =
  | { ok: true }
  | { notFound: true }
  | { err: string };

/**
 * summary job 한 건 처리 (워커/API에서 호출)
 */
export async function processSummaryJobService(
  input: ProcessSummaryJobInput,
  deps: ProcessSummaryJobDeps
): Promise<ProcessSummaryJobResult> {
  const { jobId, msgId } = input;
  const {
    summaryJobRepository,
    blockRepository,
    videoRepository,
    videoSummaryRepository,
    actionTransactionRepository,
    archiveQueueMessage,
    deleteQueueMessage,
  } = deps;

  const jobAggregate = await summaryJobRepository.findById(jobId);
  if (!jobAggregate) {
    if (msgId != null) {
      await deleteQueueMessage(msgId);
    }
    return { notFound: true };
  }

  const job = jobAggregate.getJob();

  try {
    const block = await blockRepository.findById(new BlockId(job.blockId));
    if (!block) {
      throw new Error('Block not found');
    }
    if (block.blockType.value !== 'youtube') {
      throw new Error('Block is not a YouTube block');
    }

    const videoAggregate = await videoRepository.findBySlug(job.youtubeId);
    if (!videoAggregate) {
      throw new Error('Video not found');
    }
    const videoId = videoAggregate.getVideo().id.value;

    const youtubeProperties = block.properties as YoutubeBlockPropertiesVO;

    const result = await extractAndUpdateSummary({
      block,
      orgId: job.orgId,
      videoId,
      language: job.language,
      repositories: {
        videoRepository,
        blockRepository,
        videoSummaryRepository,
        actionTransactionRepository,
      },
      youtubeProperties,
    });

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    if (msgId != null) {
      await archiveQueueMessage(msgId);
    }

    jobAggregate.complete({ jobId });
    await summaryJobRepository.update(jobAggregate);

    return { ok: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    try {
      const failedAggregate = await summaryJobRepository.findById(jobId);
      if (failedAggregate) {
        failedAggregate.fail({ jobId, errorMessage });
        await summaryJobRepository.update(failedAggregate);
      }
    } catch (updateError) {
      console.error(
        '[processSummaryJobService] Failed to update job status:',
        updateError
      );
    }

    return { err: errorMessage };
  }
}
