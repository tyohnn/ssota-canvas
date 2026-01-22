/**
 * Video 요약 처리 Hook (언어 변경 시 자동 처리)
 *
 * readonly 모드에 따라 다른 액션 사용:
 * - readonly: false → processVideoSummaryAction (일반 모드)
 * - readonly: true → processVideoSummaryForPublishedPageAction (퍼블릭 페이지)
 *
 * 언어가 변경될 때 자동으로 요약을 처리함
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import {
  processVideoSummaryAction,
} from '../../../actions/summary/process-video-summary.action';
import { processVideoSummaryForPublishedPageAction } from '../../../actions/summary/process-video-summary-for-published-page.action';
import type { VideoSummaryView } from '../../../shared/dtos/views/video-summary.views';

export interface UseProcessVideoSummaryParams {
  blockId: string;
  youtubeId: string;
  language: string;
  readonly: boolean;
  publishToken?: string; // readonly 모드에서만 사용
  enabled?: boolean;
}

export interface UseProcessVideoSummaryResult {
  summary: VideoSummaryView | null | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Video 요약 처리 Hook (언어 변경 시 자동 처리)
 */
export function useProcessVideoSummary({
  blockId,
  youtubeId,
  language,
  readonly,
  publishToken,
  enabled = true,
}: UseProcessVideoSummaryParams): UseProcessVideoSummaryResult {
  const queryKey = readonly
    ? ['process-video-summary-published', blockId, youtubeId, language, publishToken]
    : ['process-video-summary', blockId, youtubeId, language];

  const queryEnabled = enabled && !!blockId && !!youtubeId && !!language;
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<VideoSummaryView | null>({
    queryKey,
    queryFn: async () => {
      if (readonly) {
        // 퍼블릭 페이지 모드
        if (!publishToken) {
          throw new Error('Publish token is required for published page mode');
        }

        const result = await processVideoSummaryForPublishedPageAction({
          publishToken,
          blockId,
          youtubeId,
          language,
        });

        if (result.success) {
          // undefined를 null로 변환하여 캐시에 저장 (요약이 없는 경우도 유효한 상태)
          return result.data.summary ?? null;
        }

        throw new Error(result.error);
      } else {
        // 일반 모드
        const result = await processVideoSummaryAction({
          blockId,
          youtubeId,
          language,
        });

        if (result.success) {
          // undefined를 null로 변환하여 캐시에 저장 (요약이 없는 경우도 유효한 상태)
          return result.data.summary ?? null;
        }

        throw new Error(result.error);
      }
    },
    enabled: queryEnabled,
    staleTime: 24 * 60 * 60 * 1000, // 24시간 (요약은 한번 생성되면 거의 변경되지 않음)
    gcTime: 24 * 60 * 60 * 1000, // 24시간
    // placeholderData를 사용하지 않음
    // 이유: 언어를 변경할 때 이전 언어의 데이터가 placeholder로 표시되는 것을 방지
    // 캐시가 없으면 loading을 표시하고, 캐시가 있으면 즉시 표시
  });

  // 로딩 상태 계산
  // - data가 undefined이고 isLoading이면 → loading (캐시 없음)
  // - data가 null이면 → "요약 없음" 상태 (캐시됨, 즉시 표시)
  // - data가 VideoSummaryView면 → 요약 있음 (캐시됨, 즉시 표시)
  const isLoadingState = isLoading && data === undefined;

  return {
    summary: data, // null을 그대로 반환 (요약 없음도 유효한 캐시 상태)
    isLoading: isLoadingState,
    error: error?.message || null,
    refetch,
  };
}