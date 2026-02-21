/**
 * Get Latest Source Job By Block ID Service
 *
 * block_id 기준 최신 source job 조회 (status 무관, completed 포함).
 * AI status 패널 초기 동기화용: 요약이 이미 있으면 Realtime 이벤트 없이 completed 상태 즉시 반영.
 */
import { Result } from '@/utils/result';

import type { InProgressSourceJobView } from '../../../shared/dtos/views/source-job.views';
import type { ISourceJobRepository } from '../../repositories/interfaces/source-job.repository.interface';

export interface GetLatestSourceJobByBlockIdDeps {
  sourceJobRepository: ISourceJobRepository;
}

export async function getLatestSourceJobByBlockIdService(
  blockId: string,
  deps: GetLatestSourceJobByBlockIdDeps
): Promise<Result<InProgressSourceJobView | null, Error>> {
  const { sourceJobRepository } = deps;
  try {
    const aggregate = await sourceJobRepository.findLatestByBlockId(blockId);
    if (!aggregate) return Result.success(null);
    const job = aggregate.getJob();
    return Result.success({
      id: job.id.value,
      block_id: job.blockId.value,
      language: job.language,
      status: job.status,
      current_step: job.currentStep,
      error_message: job.errorMessage,
      created_at: job.createdAt.toISOString(),
      started_at: job.startedAt?.toISOString(),
      completed_at: job.completedAt?.toISOString(),
    });
  } catch (error) {
    return Result.error(
      error instanceof Error
        ? error
        : new Error('Failed to get latest source job')
    );
  }
}
