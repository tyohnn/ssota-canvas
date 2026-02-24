/**
 * Ensure Source Job Service
 *
 * 메타데이터 직후: (sourceId, language)에 대해 요약이 이미 있으면 completed job 등록,
 * 없으면 source_job_queue에 잡을 넣고 route에서 순차 처리(스크립트 없으면 추출 → ensureSourceSummary).
 */
import { Result } from '@/utils/result';

import type { IQueueAdapter } from '@/domains/queue';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { SourceJobAggregate } from '../../../shared/aggregates/source-job.aggregate';
import { OrgId } from '../../../shared/value-objects/org-id.vo';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import type { ISourceJobRepository } from '../../repositories/interfaces/source-job.repository.interface';
import type { ISourceSummaryRepository } from '../../repositories/interfaces/source-summary.repository.interface';
import { createSourceJobService } from './create-source-job.service';

export interface EnsureSourceJobSafeDto {
  blockId: string;
  orgId: string;
  sourceId: string;
  language: string;
}

export interface EnsureSourceJobDeps {
  sourceSummaryRepository: ISourceSummaryRepository;
  sourceJobRepository: ISourceJobRepository;
  queueAdapter: IQueueAdapter;
}

export async function ensureSourceJobService(
  safeDto: EnsureSourceJobSafeDto,
  deps: EnsureSourceJobDeps
): Promise<Result<{ jobId: string; alreadyExists: boolean }, Error>> {
  const { sourceSummaryRepository, sourceJobRepository, queueAdapter } = deps;

  const language = safeDto.language || 'en';
  const sourceIdVo = new SourceId(safeDto.sourceId);

  const existing = await sourceSummaryRepository.findBySourceIdAndLanguage(
    sourceIdVo,
    language
  );

  if (existing) {
    const blockIdVo = new BlockId(safeDto.blockId);
    const orgIdVo = new OrgId(safeDto.orgId);
    const existingJob = await sourceJobRepository.findByBlockIdAndLanguage(
      blockIdVo.value,
      language
    );

    if (existingJob) {
      const agg = SourceJobAggregate.reconstituteForReplace({
        id: existingJob.getJob().id,
        blockId: blockIdVo,
        orgId: orgIdVo,
        sourceId: sourceIdVo,
        language,
        status: 'completed',
        completedAt: new Date(),
      });
      await sourceJobRepository.update(agg);
      return Result.success({
        jobId: existingJob.getJob().id.value,
        alreadyExists: true,
      });
    }

    const aggregate = SourceJobAggregate.createCompletedSourceJob({
      blockId: blockIdVo,
      orgId: orgIdVo,
      sourceId: sourceIdVo,
      language,
    });
    const { id: jobId } = await sourceJobRepository.create(aggregate);

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(e => e.handle()));
    aggregate.markEventsAsCommitted();

    return Result.success({ jobId, alreadyExists: true });
  }

  const createResult = await createSourceJobService(
    {
      blockId: safeDto.blockId,
      orgId: safeDto.orgId,
      sourceId: safeDto.sourceId,
      language,
    },
    sourceJobRepository,
    queueAdapter
  );

  if (createResult.isError()) {
    return Result.error(createResult.error);
  }
  return Result.success({
    jobId: createResult.value.jobId,
    alreadyExists: false,
  });
}
