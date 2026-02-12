/**
 * Video Script (youtube_app_space.videos.script) 조회 훅
 * 구조화된 transcript 반환 - 타임스탬프, TOC, 인용 등 UI 기능용
 * (Published Page에서는 스크립트 미노출)
 */
'use client';

import { useQuery } from '@tanstack/react-query';

import { getVideoScriptAction } from '../../../actions/script/get-video-script.action';
import type { YoutubeScript } from '../../../shared/types/transcript.types';

export type UseVideoScriptParams = {
  blockId: string;
  enabled?: boolean;
};

export type UseVideoScriptResult = {
  script: YoutubeScript | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useVideoScript(
  params: UseVideoScriptParams
): UseVideoScriptResult {
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<{ script: YoutubeScript | null }>({
    queryKey: ['video-script', params.blockId],
    queryFn: async () => {
      const result = await getVideoScriptAction({
        blockId: params.blockId,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: (params.enabled ?? true) && !!params.blockId,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  return {
    script: data?.script,
    isLoading,
    error: queryError instanceof Error ? queryError : null,
    refetch: () => refetch(),
  };
}
