/**
 * Get In-Progress Summary Job Service
 *
 * 페이지 기준으로 진행 중(pending/processing)인 summary job 전체 조회.
 * 새로고침 시 Status 창 복원용 Read Model.
 */
import { Result } from '@/utils/result';

import type { InProgressSummaryJobView } from '../../../shared/dtos/responses/video-summary.responses';
import type { ISummaryJobRepository } from '../../repositories/interfaces/summary-job.repository.interface';

export interface GetInProgressSummaryJobDeps {
  summaryJobRepository: ISummaryJobRepository;
}

export async function getInProgressSummaryJobService(
  pageId: string,
  deps: GetInProgressSummaryJobDeps
): Promise<Result<{ jobs: InProgressSummaryJobView[] }, Error>> {
  const { summaryJobRepository } = deps;
  try {
    const rows =
      await summaryJobRepository.findAllInProgressJobsByPageId(pageId);
    const jobs: InProgressSummaryJobView[] = rows.map(row => ({
      id: row.id,
      block_id: row.block_id,
      status: row.status,
      error_message: row.error_message ?? undefined,
      created_at: row.created_at.toISOString(),
      started_at: row.started_at?.toISOString(),
      completed_at: row.completed_at?.toISOString(),
    }));
    return Result.success({ jobs });
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Failed to get in-progress summary jobs')
    );
  }
}
