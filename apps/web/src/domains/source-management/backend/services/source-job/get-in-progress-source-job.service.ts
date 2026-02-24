/**
 * Get In-Progress Source Job Service
 *
 * block_id 또는 page_id 기준으로 진행 중(pending/processing)인 source job 조회.
 * 새로고침 시 Status 창 복원용 Read Model.
 */
import { Result } from '@/utils/result';

import type { InProgressSourceJobView } from '../../../shared/dtos/views/source-job.views';
import type { ISourceJobRepository } from '../../repositories/interfaces/source-job.repository.interface';

export type { InProgressSourceJobView } from '../../../shared/dtos/views/source-job.views';

export interface GetInProgressSourceJobDeps {
  sourceJobRepository: ISourceJobRepository;
}

/**
 * 단일 block_id로 진행 중인 source job 조회
 */
export async function getInProgressSourceJobByBlockIdService(
  blockId: string,
  deps: GetInProgressSourceJobDeps
): Promise<Result<InProgressSourceJobView | null, Error>> {
  const { sourceJobRepository } = deps;
  try {
    const aggregate =
      await sourceJobRepository.findInProgressByBlockId(blockId);
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
      error instanceof Error ? error : new Error('Failed to get in-progress source job')
    );
  }
}

/**
 * 페이지 기준으로 진행 중인 source job 전체 조회
 */
export async function getInProgressSourceJobsByPageIdService(
  pageId: string,
  deps: GetInProgressSourceJobDeps
): Promise<Result<{ jobs: InProgressSourceJobView[] }, Error>> {
  const { sourceJobRepository } = deps;
  try {
    const rows =
      await sourceJobRepository.findAllInProgressJobsByPageId(pageId);
    const jobs: InProgressSourceJobView[] = rows.map(row => ({
      id: row.id,
      block_id: row.block_id,
      language: row.language,
      status: row.status,
      current_step: row.current_step,
      error_message: row.error_message ?? undefined,
      created_at: row.created_at.toISOString(),
      started_at: row.started_at?.toISOString(),
      completed_at: row.completed_at?.toISOString(),
    }));
    return Result.success({ jobs });
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Failed to get in-progress source jobs')
    );
  }
}
