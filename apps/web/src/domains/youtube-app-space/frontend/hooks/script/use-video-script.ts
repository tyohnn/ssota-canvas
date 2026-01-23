/**
 * Video Script 조회 훅
 *
 * YouTube 비디오의 스크립트를 조회
 *
 * readonly 모드에 따라 다른 액션 사용:
 * - readonly: false → processVideoScriptAction (일반 모드)
 * - readonly: true → processVideoScriptForPublishedPageAction (퍼블릭 페이지)
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { processVideoScriptAction } from '../../../actions/script/process-video-script.action';
import { processVideoScriptForPublishedPageAction } from '../../../actions/script/process-video-script-for-published-page.action';
import type { ProcessVideoScriptDTO } from '../../../shared/dtos/responses/video.responses';

export type UseVideoScriptParams = {
  blockId: string;
  youtubeId: string;
  readonly?: boolean;
  publishToken?: string; // readonly 모드에서만 사용
  enabled?: boolean;
};

export type UseVideoScriptResult = {
  script: ProcessVideoScriptDTO['youtube']['script'] | undefined;
  video: ProcessVideoScriptDTO['youtube'] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Video Script 조회 훅
 *
 * @param params - blockId, youtubeId, readonly, publishToken, enabled 옵션
 * @returns 스크립트, 비디오 정보, 로딩 상태, 에러
 */
export function useVideoScript(
  params: UseVideoScriptParams
): UseVideoScriptResult {
  const { blockId, youtubeId, readonly = false, publishToken, enabled = true } = params;

  const queryKey = readonly
    ? ['youtube-script-published', blockId, youtubeId, publishToken]
    : ['youtube-script', blockId, youtubeId];

  const {
    data: scriptData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<ProcessVideoScriptDTO>({
    queryKey,
    queryFn: async (): Promise<ProcessVideoScriptDTO> => {
      if (!youtubeId || !blockId) {
        throw new Error('YouTube ID or Block ID not found');
      }

      if (readonly) {
        // 퍼블릭 페이지 모드
        if (!publishToken) {
          throw new Error('Publish token is required for published page mode');
        }

        const result = await processVideoScriptForPublishedPageAction({
          publishToken,
          blockId,
          youtubeId,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to load script');
        }

        return result.data;
      } else {
        // 일반 모드
        const result = await processVideoScriptAction({
          blockId,
          youtubeId,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to load script');
        }

        return result.data;
      }
    },
    enabled: enabled && !!blockId && !!youtubeId,
    staleTime: 24 * 60 * 60 * 1000, // 24시간 캐싱 (스크립트는 거의 변경되지 않음)
    retry: 1,
  });

  return {
    script: scriptData?.youtube.script,
    video: scriptData?.youtube,
    isLoading,
    error: queryError instanceof Error ? queryError : null,
    refetch: () => {
      refetch();
    },
  };
}
