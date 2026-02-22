/**
 * useInProgressSourceJob
 *
 * 블록 기준 진행 중인 Source Job 조회.
 * Summary 탭, Timeline 탭 등에서 공통 사용.
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { getInProgressSourceJobByBlockIdAction } from '@/domains/source-management/actions/summary/get-in-progress-source-job-by-block-id.action';

export interface UseInProgressSourceJobParams {
  blockSlug: string;
  sourceId: string | undefined;
  workspaceId: string | undefined;
  /** false면 쿼리 비활성화 (예: Summary readonly일 때) */
  enabled?: boolean;
}

export function useInProgressSourceJob({
  blockSlug,
  sourceId,
  workspaceId,
  enabled = true,
}: UseInProgressSourceJobParams) {
  return useQuery({
    queryKey: ['source-job-in-progress', blockSlug],
    queryFn: async () => {
      if (!workspaceId || !blockSlug || !sourceId) return null;
      const result = await getInProgressSourceJobByBlockIdAction({
        workspaceId,
        blockId: blockSlug,
      });
      return result.success ? result.data : null;
    },
    enabled: !!workspaceId && !!blockSlug && !!sourceId && enabled,
    staleTime: 5000,
  });
}
