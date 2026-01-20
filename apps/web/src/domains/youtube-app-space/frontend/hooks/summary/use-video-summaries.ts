/**
 * Video Summaries 조회 훅
 *
 * YouTube 비디오의 모든 언어 요약을 조회
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { getVideoSummariesAction } from '../../../actions/summary/get-video-summaries.action';
import type { GetSummariesDTO } from '../../../shared/dtos/responses/video-summary.responses';

export type UseVideoSummariesParams = {
  blockId: string;
  youtubeId: string;
  summaryAccessGrantedLanguages?: string[];
  enabled?: boolean;
};

export type UseVideoSummariesResult = {
  summaries: GetSummariesDTO['summaries'];
  video: GetSummariesDTO['video'] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Video Summaries 조회 훅
 *
 * @param params - blockId, youtubeId, summaryAccessGrantedLanguages, enabled 옵션
 * @returns 요약 목록, 비디오 정보, 로딩 상태, 에러
 */
export function useVideoSummaries(
  params: UseVideoSummariesParams
): UseVideoSummariesResult {
  const {
    blockId,
    youtubeId,
    summaryAccessGrantedLanguages,
    enabled = true,
  } = params;

  const {
    data: summariesData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<GetSummariesDTO>({
    queryKey: [
      'youtube-summaries',
      blockId,
      youtubeId,
      summaryAccessGrantedLanguages,
    ],
    queryFn: async (): Promise<GetSummariesDTO> => {
      if (!youtubeId || !blockId) {
        throw new Error('YouTube ID or Block ID not found');
      }

      const result = await getVideoSummariesAction({
        blockId,
        youtubeId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to load summaries');
      }

      return result.data;
    },
    enabled: enabled && !!blockId && !!youtubeId,
    staleTime: 24 * 60 * 60 * 1000, // 24시간 캐싱 (요약은 거의 변경되지 않음)
    retry: 1,
  });

  return {
    summaries: summariesData?.summaries || [],
    video: summariesData?.video,
    isLoading,
    error: queryError instanceof Error ? queryError : null,
    refetch: () => {
      refetch();
    },
  };
}
