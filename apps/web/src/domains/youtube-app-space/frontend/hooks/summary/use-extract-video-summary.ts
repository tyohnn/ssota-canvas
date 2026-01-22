/**
 * Video Summary 추출 훅
 *
 * YouTube 비디오의 특정 언어 요약을 추출
 * TanStack Query Mutation을 사용하여 optimistic update 지원
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { extractVideoSummaryAction } from '../../../actions/summary/extract-video-summary.action';
import type { ExtractSummaryDTO } from '../../../shared/dtos/responses/video-summary.responses';

export type UseExtractVideoSummaryParams = {
  blockId: string;
  youtubeId: string;
  readonly?: boolean;
  publishToken?: string;
  onSuccess?: (data: ExtractSummaryDTO) => void;
  onError?: (error: Error) => void;
  // Optimistic update를 위한 추가 콜백
  onMutate?: (language: string) => void | Promise<void>;
  onMutateError?: (error: Error, language: string) => void;
};

export type UseExtractVideoSummaryResult = {
  extractSummary: (language: string) => void;
  isExtracting: boolean;
};

/**
 * Video Summary 추출 훅
 *
 * @param params - blockId, youtubeId, readonly, publishToken, onSuccess, onError 콜백
 * @returns 추출 함수 및 로딩 상태
 */
export function useExtractVideoSummary(
  params: UseExtractVideoSummaryParams
): UseExtractVideoSummaryResult {
  const { blockId, youtubeId, readonly, publishToken, onSuccess, onError, onMutate, onMutateError } = params;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (language: string): Promise<ExtractSummaryDTO> => {
      if (!youtubeId || !blockId) {
        throw new Error('YouTube ID or Block ID not found');
      }

      const result = await extractVideoSummaryAction({
        blockId,
        youtubeId,
        language,
      });

      if (result.success) {
        return result.data;
      } else {
        // 에러 메시지 개선: 스크립트가 없는 경우 더 명확한 메시지 제공
        const errorMessage = result.error || 'Failed to extract summary';
        if (errorMessage.includes('Script processing completed but script not found') ||
          errorMessage.includes('SCRIPT_NOT_FOUND')) {
          throw new Error('Please extract the script first before extracting the summary. The script is required to generate the summary.');
        }
        throw new Error(errorMessage);
      }
    },
    onMutate: async (language: string) => {
      // Optimistic update: 사용 가능한 언어 목록에 즉시 추가
      const queryKey = readonly
        ? ['available-summary-languages-published', blockId, youtubeId, publishToken]
        : ['available-summary-languages', blockId, youtubeId];

      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey });

      // 이전 값 저장 (롤백용)
      const previousLanguages = queryClient.getQueryData<string[]>(queryKey);

      // Optimistic update: 새로운 언어를 목록에 추가
      if (previousLanguages && !previousLanguages.includes(language)) {
        queryClient.setQueryData<string[]>(queryKey, (old) => {
          return old ? [...old, language] : [language];
        });
      }

      // 부모 컴포넌트의 optimistic update 콜백 호출 (예: summaryAccessGrantedLanguages 업데이트)
      await onMutate?.(language);

      return { previousLanguages };
    },
    onSuccess: async (data, language) => {
      // 성공 시 관련 쿼리들을 invalidate하여 다시 로드
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
        // 사용 가능한 언어 목록도 갱신 (서버에서 최신 데이터 가져오기)
        queryClient.invalidateQueries({
          queryKey: readonly
            ? ['available-summary-languages-published', blockId, youtubeId, publishToken]
            : ['available-summary-languages', blockId, youtubeId],
        }),
        queryClient.invalidateQueries({
          queryKey: readonly
            ? ['process-video-summary-published', blockId, youtubeId, language, publishToken]
            : ['process-video-summary', blockId, youtubeId, language],
        }),
      ]);

      onSuccess?.(data);
    },
    onError: (error, language, context) => {
      // 실패 시 롤백: 이전 값으로 복원
      const queryKey = readonly
        ? ['available-summary-languages-published', blockId, youtubeId, publishToken]
        : ['available-summary-languages', blockId, youtubeId];

      if (context?.previousLanguages !== undefined) {
        queryClient.setQueryData(queryKey, context.previousLanguages);
      }

      // 부모 컴포넌트의 롤백 콜백 호출
      const err = error instanceof Error ? error : new Error('Unknown error');
      onMutateError?.(err, language);

      onError?.(err);
      console.error('[useExtractVideoSummary] Error extracting summary:', error);
    },
  });

  return {
    extractSummary: (language: string) => {
      mutation.mutate(language);
    },
    isExtracting: mutation.isPending,
  };
}
