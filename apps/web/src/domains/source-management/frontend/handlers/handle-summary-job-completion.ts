/**
 * Summary job 완료 시 cache invalidation 핸들러
 *
 * AI status 패널(항상 마운트)에서 Realtime 이벤트를 받을 때 호출.
 * 에디터 패널/Summary 탭이 unmount된 상태에서 job이 완료되어도
 * source-summary-languages 캐시를 갱신할 수 있음.
 *
 * 주의: source-job-in-progress는 invalidate하지 않음.
 * Summary 탭의 useSourceJobForBlock이 Realtime으로 completed를 받은 뒤
 * onJobCompleted에서 invalidate함. 여기서 invalidate하면 refetch로
 * initialJob=null이 되어, useSourceJobRealtime이 completed를 받기 전에
 * job이 null로 초기화되는 race가 발생할 수 있음 (패널 닫고 재오픈 시).
 */

import type { QueryClient } from '@tanstack/react-query';

import type { SourceJob } from '../hooks/use-source-job-realtime';

/** Realtime payload는 DB 컬럼(snake_case) 포함 */
type RealtimeSourceJob = SourceJob & { source_id?: string };

/** block_id가 UUID이면 slug(앞 8자)로 변환 (쿼리 키 포맷 일치) */
function toBlockSlug(blockId: string): string {
  if (blockId.length >= 36 && blockId.includes('-')) {
    return blockId.slice(0, 8);
  }
  return blockId;
}

export function createOnSummaryJobCompleted(queryClient: QueryClient) {
  return (blockId: string, job: RealtimeSourceJob): void => {
    if (job.status !== 'completed') return;

    const blockSlug = toBlockSlug(blockId);
    const sourceId = job.source_id;

    if (sourceId) {
      queryClient.invalidateQueries({
        queryKey: ['source-summary-languages', sourceId],
      });
    }
    queryClient.invalidateQueries({ queryKey: ['source-summary', blockSlug] });
    // source-job-in-progress는 useSourceJobForBlock의 onJobCompleted에서만 invalidate
  };
}
