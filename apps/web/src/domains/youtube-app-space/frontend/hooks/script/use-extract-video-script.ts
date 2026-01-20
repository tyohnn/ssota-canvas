/**
 * Video Script 추출 훅
 *
 * YouTube 비디오의 스크립트를 추출
 */

'use client';

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { extractVideoScriptAction } from '../../../actions/script/extract-video-script.action';
import type { ExtractScriptDTO } from '../../../shared/dtos/responses/video.responses';

export type UseExtractVideoScriptParams = {
  blockId: string;
  youtubeId: string;
  onSuccess?: (data: ExtractScriptDTO) => void;
  onError?: (error: Error) => void;
};

export type UseExtractVideoScriptResult = {
  extractScript: () => Promise<ExtractScriptDTO | null>;
  isExtracting: boolean;
};

/**
 * Video Script 추출 훅
 *
 * @param params - blockId, youtubeId, onSuccess, onError 콜백
 * @returns 추출 함수 및 로딩 상태
 */
export function useExtractVideoScript(
  params: UseExtractVideoScriptParams
): UseExtractVideoScriptResult {
  const { blockId, youtubeId, onSuccess, onError } = params;
  const queryClient = useQueryClient();
  const [isExtracting, setIsExtracting] = useState(false);

  const extractScript = async (): Promise<ExtractScriptDTO | null> => {
    if (!youtubeId || !blockId) {
      const error = new Error('YouTube ID or Block ID not found');
      onError?.(error);
      return null;
    }

    setIsExtracting(true);

    try {
      const result = await extractVideoScriptAction({
        blockId,
        youtubeId,
      });

      if (result.success) {
        // 추출 성공 시 관련 쿼리들을 invalidate하여 다시 로드
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [
              'youtube-action-transaction',
              blockId,
              'extract_script',
            ],
          }),
          queryClient.invalidateQueries({
            queryKey: ['youtube-script', blockId, youtubeId],
          }),
        ]);

        onSuccess?.(result.data);
        return result.data;
      } else {
        const error = new Error(result.error || 'Failed to extract script');
        onError?.(error);
        console.error('[useExtractVideoScript] Failed to extract script:', result);
        return null;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      console.error('[useExtractVideoScript] Error extracting script:', error);
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    extractScript,
    isExtracting,
  };
}
