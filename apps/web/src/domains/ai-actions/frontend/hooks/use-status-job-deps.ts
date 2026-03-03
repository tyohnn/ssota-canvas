/**
 * useStatusJob deps adapter for apps/web
 *
 * 브릿지: source-management, ai-actions 도메인 → packages/ui useStatusJob
 */

import { useCallback, useMemo } from 'react';

import {
  useMultiSourceJobRealtime,
  type SourceJob,
} from '@/domains/source-management/frontend/hooks';
import { getLatestSourceJobByBlockIdAction } from '@/domains/source-management/actions/summary/get-latest-source-job-by-block-id.action';
import { getInProgressSourceJobAction } from '@/domains/source-management/actions/summary/get-in-progress-source-job.action';
import { isSuccess } from '@/lib';
import { isTempPageId } from '@/domains/workspace-management/shared/utils/temp-page-id.utils';
import {
  createStatusJobPatchFromSourceJob,
  getAutoSummaryTaskTitle,
} from '@/domains/ai-actions/shared/utils/source-job-to-status-job';
import type {
  UseStatusJobDeps,
  RawSourceJob,
} from '@workspace/ui/components/ssota-ui/status-window';

function toRawSourceJob(j: SourceJob): RawSourceJob {
  return j as unknown as RawSourceJob;
}

function useSourceJobSubscriptionAdapter(
  blockIds: string[],
  onJobUpdate: (blockId: string, raw: RawSourceJob) => void
) {
  useMultiSourceJobRealtime(blockIds, (blockId, job) => {
    onJobUpdate(blockId, toRawSourceJob(job));
  });
}

/** resourceId ↔ sourceBlockId 매핑 (package는 resourceId, domain은 sourceBlockId) */
function createStatusJobPatchAdapter(
  raw: RawSourceJob,
  existingJob: Parameters<UseStatusJobDeps['createStatusJobPatch']>[1]
): ReturnType<UseStatusJobDeps['createStatusJobPatch']> {
  const domainExisting = {
    ...existingJob,
    sourceBlockId: existingJob.resourceId,
  };
  const patch = createStatusJobPatchFromSourceJob({
    raw: raw as unknown as SourceJob,
    existingJob: domainExisting as unknown as Parameters<
      typeof createStatusJobPatchFromSourceJob
    >[0]['existingJob'],
  });
  return {
    ...patch,
    resourceId: patch.sourceBlockId ?? existingJob.resourceId,
  } as ReturnType<UseStatusJobDeps['createStatusJobPatch']>;
}

export function useStatusJobDeps(): UseStatusJobDeps {
  const fetchLatestSourceJob = useCallback(
    async (params: {
      workspaceId: string;
      blockId: string;
    }): Promise<RawSourceJob | null> => {
      const result = await getLatestSourceJobByBlockIdAction(params);
      if (result.success && result.data?.job) {
        return toRawSourceJob(result.data.job as SourceJob);
      }
      return null;
    },
    []
  );

  const createStatusJobPatch = useCallback(
    (
      raw: RawSourceJob,
      existingJob: Parameters<UseStatusJobDeps['createStatusJobPatch']>[1]
    ) => createStatusJobPatchAdapter(raw, existingJob),
    []
  );

  const fetchInProgressSourceJobs = useCallback(
    async (params: { pageId: string }) => {
      const result = await getInProgressSourceJobAction(params);
      const jobs = isSuccess(result) ? result.data.jobs : [];
      return jobs.map((j) => toRawSourceJob(j as SourceJob));
    },
    []
  );

  return useMemo(
    () => ({
      useSourceJobSubscription: useSourceJobSubscriptionAdapter,
      fetchLatestSourceJob,
      createStatusJobPatch,
      getAutoSummaryTaskTitle,
      fetchInProgressSourceJobs,
      isTempPageId,
    }),
    [
      fetchLatestSourceJob,
      createStatusJobPatch,
      fetchInProgressSourceJobs,
    ]
  );
}
