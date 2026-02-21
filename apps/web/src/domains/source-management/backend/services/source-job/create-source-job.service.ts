/**
 * Create Source Job Service
 *
 * Enqueues a source job: create aggregate, save, send message to source_job_queue,
 * update pgmq_msg_id.
 */
import { Result } from '@/utils/result';

import type { IQueueAdapter } from '@/domains/queue';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { SourceJobAggregate } from '../../../shared/aggregates/source-job.aggregate';
import { OrgId } from '../../../shared/value-objects/org-id.vo';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import type { ISourceJobRepository } from '../../repositories/interfaces/source-job.repository.interface';

const SOURCE_JOB_QUEUE_NAME = 'source_job_queue';

export interface CreateSourceJobSafeDto {
  blockId: string;
  orgId: string;
  sourceId: string;
  language: string;
}

/**
 * Create a source job (aggregate + save + queue + update msg id).
 */
export async function createSourceJobService(
  safeDto: CreateSourceJobSafeDto,
  sourceJobRepository: ISourceJobRepository,
  queueAdapter: IQueueAdapter
): Promise<Result<{ jobId: string }, Error>> {
  try {
    const language = safeDto.language || 'en';
    const blockIdVo = new BlockId(safeDto.blockId);
    const orgIdVo = new OrgId(safeDto.orgId);
    const sourceIdVo = new SourceId(safeDto.sourceId);

    const existingJob = await sourceJobRepository.findByBlockIdAndLanguage(
      blockIdVo.value,
      language
    );

    let jobId: string;
    let shouldEnqueue: boolean;

    if (existingJob) {
      const prevStatus = existingJob.getJob().status;
      const agg = SourceJobAggregate.reconstituteForReplace({
        id: existingJob.getJob().id,
        blockId: blockIdVo,
        orgId: orgIdVo,
        sourceId: sourceIdVo,
        language,
        status: 'pending',
      });
      await sourceJobRepository.update(agg);
      jobId = existingJob.getJob().id.value;
      // 이미 pending이면 중복 enqueue 방지 (ensureSourceJob이 여러 번 호출될 때). failed/completed면 재시도이므로 enqueue
      shouldEnqueue = prevStatus !== 'pending' && prevStatus !== 'processing';
    } else {
      const aggregate = SourceJobAggregate.createSourceJob({
        blockId: blockIdVo,
        orgId: orgIdVo,
        sourceId: sourceIdVo,
        language,
      });
      const result = await sourceJobRepository.create(aggregate);
      jobId = result.id;

      const events = aggregate.getUncommittedEvents();
      await Promise.allSettled(events.map(e => e.handle()));
      aggregate.markEventsAsCommitted();
      shouldEnqueue = true;
    }

    if (!shouldEnqueue) {
      return Result.success({ jobId });
    }

    const msgId = await queueAdapter.send(
      SOURCE_JOB_QUEUE_NAME,
      {
        jobId,
        blockId: blockIdVo.value,
        sourceId: sourceIdVo.value,
        language,
      },
      { delaySeconds: 0 }
    );

    if (msgId != null) {
      await sourceJobRepository.updatePgmqMsgId(jobId, Number(msgId));
    }

    return Result.success({ jobId });
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
