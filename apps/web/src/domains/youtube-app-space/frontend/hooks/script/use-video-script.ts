/**
 * Video Script 조회 훅
 *
 * YouTube 비디오의 스크립트를 조회
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { getVideoScriptAction } from '../../../actions/script/get-video-script.action';
import { getVideoScriptWithoutTransactionAction } from '../../../actions/script/get-video-script-without-transaction.action';
import type { GetScriptDTO } from '../../../shared/dtos/responses/video.responses';

export type UseVideoScriptParams = {
  blockId: string;
  youtubeId: string;
  scriptAccessGranted?: boolean;
  enabled?: boolean;
};

export type UseVideoScriptResult = {
  script: GetScriptDTO['youtube']['script'] | undefined;
  video: GetScriptDTO['youtube'] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Video Script 조회 훅
 *
 * @param params - blockId, youtubeId, scriptAccessGranted, enabled 옵션
 * @returns 스크립트, 비디오 정보, 로딩 상태, 에러
 */
export function useVideoScript(
  params: UseVideoScriptParams
): UseVideoScriptResult {
  const { blockId, youtubeId, scriptAccessGranted, enabled = true } = params;

  const {
    data: scriptData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<GetScriptDTO>({
    queryKey: ['youtube-script', blockId, youtubeId, scriptAccessGranted],
    queryFn: async (): Promise<GetScriptDTO> => {
      if (!youtubeId || !blockId) {
        throw new Error('YouTube ID or Block ID not found');
      }

      // scriptAccessGranted가 true면 Action Transaction 확인 없이 직접 조회
      // (조직 내 공유 확인 불필요, 블록 권한만으로 충분)
      const result =
        scriptAccessGranted === true
          ? await getVideoScriptWithoutTransactionAction({
            blockId,
            youtubeId,
          })
          : await getVideoScriptAction({
            blockId,
            youtubeId,
          });

      if (!result.success) {
        throw new Error(result.error || 'Failed to load script');
      }

      return result.data;
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
