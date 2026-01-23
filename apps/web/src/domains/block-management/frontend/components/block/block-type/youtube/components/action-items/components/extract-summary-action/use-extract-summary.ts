'use client';

import { useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { toast } from '@workspace/ui/components/ui/sonner';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { createTabOptions } from '@/domains/canvas-management/frontend/hooks/mode/create-tab-options';

import { extractSummaryAction } from './extract-summary-action.business';

interface UseExtractSummaryParams {
  blockId: string;
  blockData: BlockNodeData;
}

export function useExtractSummary({
  blockId,
  blockData,
}: UseExtractSummaryParams) {
  const queryClient = useQueryClient();
  const canvasMode = useCanvasModeContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // blockData에서 youtubeId 추출
  const youtubeId = (() => {
    try {
      const properties = blockData?.properties as
        | YoutubeBlockProperties
        | undefined;
      if (properties) {
        const youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(properties);
        return youtubeProperties.youtubeId;
      }
    } catch (error) {
      console.warn(
        '[useExtractSummary] Failed to parse YouTube properties:',
        error
      );
    }
    return undefined;
  })();

  const extractSummary = useCallback(
    async (language: string) => {
      setIsLoading(true);
      setIsSuccess(false);

      // 1. 먼저 에디터 패널을 열어서 로딩 상태를 표시 (탭 옵션에 isExtracting 전달)
      const blockMountId = blockData.blockMountId;
      if (blockMountId) {
        canvasMode.enterBlockEditingMode(
          blockId,
          blockMountId,
          createTabOptions(BlockType.YOUTUBE, 'summary', {
            language,
            isExtracting: true,
          })
        );
      }

      const clearExtracting = () => {
        if (!blockMountId) return;
        canvasMode.updateBlockEditingTabOptions(
          { isExtracting: false },
          { blockId, blockMountId }
        );
      };

      try {
        // 2. 요약 추출 (비동기로 진행)
        const result = await extractSummaryAction(blockId, blockData, language);

        if (result.success) {
          setIsSuccess(true);
          // 2초 후 체크 아이콘 숨기기
          setTimeout(() => setIsSuccess(false), 2000);

          // 3. TanStack Query 캐시 무효화 (요약 섹션 자동 업데이트)
          if (youtubeId) {
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
              queryClient.invalidateQueries({
                queryKey: ['available-summary-languages', blockId, youtubeId],
              }),
            ]);
          }
          clearExtracting();
          // 에디터 패널은 이미 열려있고, 캐시 무효화로 자동 업데이트됨
        } else {
          clearExtracting();
          console.error(
            '[useExtractSummary] Failed to extract summary:',
            result
          );
          // 권한 에러 또는 블록을 찾을 수 없는 경우 toast 표시
          if (
            result.error?.includes('Block not found') ||
            result.error?.includes('Access denied') ||
            result.error?.includes('authority') ||
            result.error?.includes('permission')
          ) {
            toast.error("You don't have authority", {
              description:
                result.error ||
                "You don't have permission to perform this action.",
            });
          } else {
            toast.error('Failed to extract summary', {
              description:
                result.error ||
                'An error occurred while extracting the summary.',
            });
          }
        }
      } catch (error) {
        clearExtracting();
        console.error('[useExtractSummary] Error extracting summary:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [blockId, blockData, youtubeId, queryClient, canvasMode]
  );

  // 이미 추출된 요약의 탭 열기 (API 호출 없이)
  const openSummaryTab = useCallback(
    (language: string) => {
      const blockMountId = blockData.blockMountId;
      if (blockMountId) {
        canvasMode.enterBlockEditingMode(
          blockId,
          blockMountId,
          createTabOptions(BlockType.YOUTUBE, 'summary', { language })
        );
      }
    },
    [blockId, blockData, canvasMode]
  );

  return {
    extractSummary,
    openSummaryTab,
    isLoading,
    isSuccess,
  };
}
