/**
 * Script Section Business Logic Hook
 *
 * YouTube 스크립트 로드 및 관리 로직
 *
 * ✅ TanStack Query 사용:
 * - 컴포넌트가 렌더링될 때만 스크립트 로드 (enabled 옵션)
 * - 자동 캐싱: 같은 blockId/youtubeId로 여러 번 호출해도 한 번만 요청
 * - staleTime: 24시간 (스크립트는 한번 추출되면 거의 변경되지 않음)
 */

'use client';

import { useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { checkActionTransactionAction } from '@/domains/youtube-app-space/actions/transaction/check-action-transaction.action';
import { extractVideoScriptAction } from '@/domains/youtube-app-space/actions/video/extract-video-script.action';
import { getVideoScriptAction } from '@/domains/youtube-app-space/actions/video/get-video-script.action';
import type { GetScriptDTO } from '@/domains/youtube-app-space/shared/dtos/responses/video.responses';

import type { ScriptSectionBusinessLogic } from './types';

/**
 * Script Section Business Logic Hook
 *
 * YouTube 블록의 스크립트를 로드하고 관리하는 비즈니스 로직
 */
export function useScriptSectionBusiness(
  blockId: string,
  blockData: BlockNodeData | undefined
): ScriptSectionBusinessLogic {
  const queryClient = useQueryClient();
  const [isExtracting, setIsExtracting] = useState(false);

  // Block properties에서 YouTube 정보 추출
  const properties = blockData?.properties as
    | YoutubeBlockProperties
    | undefined;

  // YoutubeBlockPropertiesVO로 변환하여 타입 안전하게 youtubeId와 youtubeTitle 추출
  let youtubeId: string | undefined;
  let youtubeTitle: string | undefined;
  try {
    if (properties) {
      const youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(properties);
      youtubeId = youtubeProperties.youtubeId;
      youtubeTitle = youtubeProperties.youtubeTitle;
    }
  } catch (error) {
    console.warn('[ScriptSection] Failed to parse YouTube properties:', error);
  }

  // Action Transaction 확인 (추출 액션이 실행된 적이 있는지)
  const { data: actionTransactionData, isLoading: isCheckingTransaction } =
    useQuery({
      queryKey: ['youtube-action-transaction', blockId, 'extract_script'],
      queryFn: async () => {
        if (!blockId) {
          return { exists: false };
        }

        const result = await checkActionTransactionAction({
          blockId,
          actionType: 'extract_script',
        });

        if (!result.success) {
          // 에러 발생 시 false로 처리 (안전하게 처리)
          return { exists: false };
        }

        return result.data;
      },
      enabled: !!blockId,
      staleTime: 24 * 60 * 60 * 1000, // 24시간 캐싱 (스크립트는 거의 변경되지 않음)
      retry: 1,
    });

  const hasExtractAction = actionTransactionData?.exists ?? false;

  // TanStack Query로 스크립트 로드
  // ✅ 추출 액션이 실행된 적이 있는 블록만 로드
  const {
    data: scriptData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<GetScriptDTO>({
    queryKey: ['youtube-script', blockId, youtubeId],
    queryFn: async (): Promise<GetScriptDTO> => {
      if (!youtubeId || !blockId) {
        throw new Error('YouTube ID or Block ID not found');
      }

      const result = await getVideoScriptAction({
        blockId,
        youtubeId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to load script');
      }

      return result.data;
    },
    // ✅ 추출 액션이 실행된 적이 있고, blockId와 youtubeId가 모두 있을 때만 로드
    enabled:
      !!blockId && !!youtubeId && hasExtractAction && !isCheckingTransaction,
    staleTime: 24 * 60 * 60 * 1000, // 24시간 캐싱 (스크립트는 거의 변경되지 않음)
    retry: 1,
  });

  // 스크립트 데이터 추출
  const script = scriptData?.youtube.script;

  // 에러 처리
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load script'
    : null;

  // 스크립트 추출/새로고침 핸들러
  const handleExtractScript = async () => {
    if (!blockData || !youtubeId) {
      console.error('[handleExtractScript] Block data or YouTube ID not found');
      return;
    }

    setIsExtracting(true);

    try {
      // extract-video-script.action.ts 직접 호출 (transaction 생성 및 스크립트 추출)
      const result = await extractVideoScriptAction({
        blockId,
        youtubeId,
      });

      if (result.success) {
        // 추출 성공 시 관련 쿼리들을 invalidate하여 다시 로드
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['youtube-action-transaction', blockId, 'extract_script'],
          }),
          queryClient.invalidateQueries({
            queryKey: ['youtube-script', blockId, youtubeId],
          }),
        ]);
      } else {
        console.error(
          '[handleExtractScript] Failed to extract script:',
          result
        );
        // 에러는 toast로 표시되므로 여기서는 로그만 남김
      }
    } catch (error) {
      console.error('[handleExtractScript] Error extracting script:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    youtubeId,
    youtubeTitle,
    script,
    isLoading: isLoading || isCheckingTransaction,
    error,
    handleExtractScript,
    hasExtractAction,
    isExtracting,
  };
}
