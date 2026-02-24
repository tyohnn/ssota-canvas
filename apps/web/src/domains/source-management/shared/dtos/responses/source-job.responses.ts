/**
 * Source Job Response DTOs (Server Actions 출력)
 */

import type { InProgressSourceJobView } from '../views/source-job.views';

export interface GetInProgressSourceJobDTO {
  jobs: InProgressSourceJobView[];
}

export interface GetInProgressSourceJobByBlockIdDTO {
  job: InProgressSourceJobView | null;
  /** Block UUID for Realtime filter (source_jobs.block_id) */
  blockUuid: string;
}
