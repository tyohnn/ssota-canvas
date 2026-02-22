/**
 * useSourceJobForBlock
 *
 * 블록의 source job 상태 (Realtime 구독 + 완료 시 invalidation, tabOptions clear)
 * 단일 책임: "이 블록의 job 상태와 Realtime 연동"
 */

'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getLatestSourceJobByBlockIdAction } from '@/domains/source-management/actions/summary/get-latest-source-job-by-block-id.action';
import type { SourceJob } from '@/domains/source-management/frontend/hooks';
import {
  useInProgressSourceJob,
  useSourceJobRealtime,
} from '@/domains/source-management/frontend/hooks';

export interface UseSourceJobForBlockParams {
  blockSlug: string;
  sourceId: string | undefined;
  workspaceId: string | undefined;
  readonly: boolean;
  /** job 완료 시 호출 (tabOptions.isExtracting 해제 등) */
  onJobCompleted?: () => void;
}

export interface UseSourceJobForBlockResult {
  job: SourceJob | null;
  initialJob: SourceJob | null;
  isCompleted: boolean;
  isProcessing: boolean;
  isFetchingInProgressJob: boolean;
}

export function useSourceJobForBlock({
  blockSlug,
  sourceId,
  workspaceId,
  readonly,
  onJobCompleted,
}: UseSourceJobForBlockParams): UseSourceJobForBlockResult {
  const queryClient = useQueryClient();
  const prevCompletedRef = useRef(false);
  const fallbackCheckedRef = useRef(false);

  // 1. 패널 재오픈 시 in-progress job 조회 (블록 액션 버튼 등 시나리오)
  const {
    data: inProgressJobData,
    isFetching: isFetchingInProgressJob,
  } = useInProgressSourceJob({
    blockSlug,
    sourceId,
    workspaceId,
    enabled: !readonly,
  });

  // 2. 조회된 job을 Realtime 초기값으로 사용
  const initialJob: SourceJob | null =
    inProgressJobData?.job != null
      ? (inProgressJobData.job as SourceJob)
      : null;

  // 3. Realtime 구독 ID (source_jobs.block_id는 UUID, API 응답에 항상 blockUuid 포함)
  // API 로딩 전에는 undefined → 구독 비활성화, 로딩 완료 후 blockUuid로 구독
  const realtimeBlockId = inProgressJobData?.blockUuid ?? '';

  /**
   * 4. source_jobs Realtime 구독 (INSERT/UPDATE 이벤트)
   *
   * - realtimeBlockId: source_jobs.block_id(UUID). getInProgressSourceJobByBlockIdAction 로딩 전 ''이면 구독 비활성화.
   * - initialJob: 1번 query 결과. Realtime 이벤트 전 초기 상태 + invalidate/refetch 시
   *   completed job 보존용. useSourceJobRealtime 주석 참고.
   */
  const { isCompleted, isProcessing, job } = useSourceJobRealtime(
    realtimeBlockId,
    initialJob
  );

  // 5. Job 완료 시: 관련 query invalidate + onJobCompleted (tabOptions.isExtracting 해제)
  useEffect(() => {
    if (!blockSlug || !sourceId) return;
    if (isCompleted && !prevCompletedRef.current) {
      prevCompletedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['source-summary', blockSlug] });
      queryClient.invalidateQueries({
        queryKey: ['source-summary-languages', sourceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['source-job-in-progress', blockSlug],
      });
      onJobCompleted?.();
    }
    if (!isCompleted) prevCompletedRef.current = false;
  }, [blockSlug, sourceId, isCompleted, queryClient, onJobCompleted]);

  /**
   * Fallback: 탭 전환 등으로 Realtime 구독을 놓쳤을 때 (Summary → Metadata → Summary)
   * job 완료 이벤트를 받지 못할 수 있음. 이때 최신 job 조회로 완료된 경우 onJobCompleted 호출.
   */
  useEffect(() => {
    if (
      !realtimeBlockId ||
      !blockSlug ||
      !sourceId ||
      !workspaceId ||
      initialJob != null ||
      isCompleted ||
      fallbackCheckedRef.current ||
      isFetchingInProgressJob
    ) {
      return;
    }
    fallbackCheckedRef.current = true;
    const timer = setTimeout(() => {
      getLatestSourceJobByBlockIdAction({ workspaceId, blockId: blockSlug })
        .then(result => {
          if (!result.success || !result.data?.job) return;
          const latest = result.data.job as SourceJob;
          if (latest.status !== 'completed') return;
          const completedAt = latest.completed_at
            ? new Date(latest.completed_at).getTime()
            : 0;
          const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
          if (completedAt < twoMinutesAgo) return;
          prevCompletedRef.current = true;
          queryClient.invalidateQueries({ queryKey: ['source-summary', blockSlug] });
          queryClient.invalidateQueries({
            queryKey: ['source-summary-languages', sourceId],
          });
          queryClient.invalidateQueries({
            queryKey: ['source-job-in-progress', blockSlug],
          });
          onJobCompleted?.();
        })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [
    realtimeBlockId,
    blockSlug,
    sourceId,
    workspaceId,
    initialJob,
    isCompleted,
    isFetchingInProgressJob,
    queryClient,
    onJobCompleted,
  ]);

  return {
    job,
    initialJob,
    isCompleted,
    isProcessing,
    isFetchingInProgressJob,
  };
}
