/**
 * Video Summary 추출 훅
 *
 * YouTube 비디오의 특정 언어 요약을 추출
 */

'use client';

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { extractVideoSummaryAction } from '../../../actions/summary/extract-video-summary.action';
import type { ExtractSummaryDTO } from '../../../shared/dtos/responses/video-summary.responses';

export type UseExtractVideoSummaryParams = {
  blockId: string;
  youtubeId: string;
  onSuccess?: (data: ExtractSummaryDTO) => void;
  onError?: (error: Error) => void;
};

export type UseExtractVideoSummaryResult = {
  extractSummary: (language: string) => Promise<ExtractSummaryDTO | null>;
  isExtracting: boolean;
};

/**
 * Video Summary 추출 훅
 *
 * @param params - blockId, youtubeId, onSuccess, onError 콜백
 * @returns 추출 함수 및 로딩 상태
 */
export function useExtractVideoSummary(
  params: UseExtractVideoSummaryParams
): UseExtractVideoSummaryResult {
  const { blockId, youtubeId, onSuccess, onError } = params;
  const queryClient = useQueryClient();
  const [isExtracting, setIsExtracting] = useState(false);

  const extractSummary = async (
    language: string
  ): Promise<ExtractSummaryDTO | null> => {
    if (!youtubeId || !blockId) {
      const error = new Error('YouTube ID or Block ID not found');
      onError?.(error);
      return null;
    }

    setIsExtracting(true);

    try {
      const result = await extractVideoSummaryAction({
        blockId,
        youtubeId,
        language,
      });

      if (result.success) {
        // 추출 성공 시 관련 쿼리들을 invalidate하여 다시 로드
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [
              'youtube-action-transaction',
              blockId,
              'extract_summary',
            ],
          }),
          queryClient.invalidateQueries({
            queryKey: ['youtube-summaries', blockId, youtubeId],
          }),
        ]);

        onSuccess?.(result.data);
        return result.data;
      } else {
        const error = new Error(result.error || 'Failed to extract summary');
        onError?.(error);
        console.error('[useExtractVideoSummary] Failed to extract summary:', result);
        return null;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      console.error('[useExtractVideoSummary] Error extracting summary:', error);
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    extractSummary,
    isExtracting,
  };
}
