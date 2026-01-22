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

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { processVideoScriptAction } from '@/domains/youtube-app-space/actions/script/process-video-script.action';
import { processVideoScriptForPublishedPageAction } from '@/domains/youtube-app-space/actions/script/process-video-script-for-published-page.action';
import { useVideoScript } from '@/domains/youtube-app-space/frontend/hooks';

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
  // Readonly 모드 확인 및 publish token 가져오기 (퍼블릭 페이지 등)
  const { readonly, publishToken } = useCanvasReadOnly();

  // Block properties에서 YouTube 정보 추출
  const properties = blockData?.properties as
    | YoutubeBlockProperties
    | undefined;

  // YoutubeBlockPropertiesVO로 변환하여 타입 안전하게 youtubeId와 youtubeTitle 추출
  let youtubeId: string | undefined;
  let youtubeTitle: string | undefined;
  let scriptAccessGranted: boolean | undefined;
  try {
    if (properties) {
      const youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(properties);
      youtubeId = youtubeProperties.youtubeId;
      youtubeTitle = youtubeProperties.youtubeTitle;
      scriptAccessGranted = youtubeProperties.scriptAccessGranted;
    }
  } catch (error) {
    console.warn('[ScriptSection] Failed to parse YouTube properties:', error);
  }

  // 스크립트 액션은 항상 성공을 반환하므로 별도 확인 불필요

  // 스크립트 로드 (항상 성공 반환)
  const {
    script,
    isLoading: isLoadingScript,
    error: scriptError,
    refetch: refetchScript,
  } = useVideoScript({
    blockId,
    youtubeId: youtubeId || '',
    readonly,
    publishToken: readonly ? publishToken : undefined,
    enabled: !!blockId && !!youtubeId,
  });

  const queryClient = useQueryClient();

  // 스크립트 추출 mutation
  const extractMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!youtubeId || !blockId) {
        throw new Error('YouTube ID or Block ID not found');
      }

      if (readonly) {
        // Published page 모드
        if (!publishToken) {
          throw new Error('Publish token is required for published page mode');
        }

        const result = await processVideoScriptForPublishedPageAction({
          publishToken,
          blockId,
          youtubeId,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to extract script');
        }
      } else {
        // 일반 모드
        const result = await processVideoScriptAction({
          blockId,
          youtubeId,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to extract script');
        }
      }
    },
    onSuccess: async () => {
      // 성공 시 관련 쿼리들을 invalidate하여 다시 로드
      if (youtubeId) {
        const queryKey = readonly
          ? ['youtube-script-published', blockId, youtubeId, publishToken]
          : ['youtube-script', blockId, youtubeId];

        await queryClient.invalidateQueries({
          queryKey,
        });
      }
    },
  });

  // 스크립트 추출 핸들러
  const handleExtractScript = async (): Promise<void> => {
    if (!youtubeId || !blockId) {
      console.warn('[ScriptSection] YouTube ID or Block ID not found');
      return;
    }

    extractMutation.mutate();
  };

  // 에러 처리
  const error = scriptError
    ? scriptError.message
    : null;

  return {
    youtubeId,
    youtubeTitle,
    script,
    isLoading: isLoadingScript,
    error,
    handleExtractScript,
    isExtracting: extractMutation.isPending,
  };
}
