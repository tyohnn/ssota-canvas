'use client';

import { useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { toast } from '@workspace/ui/components/ui/sonner';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';

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

  const extractSummary = useCallback(async () => {
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const result = await extractSummaryAction(blockId, blockData);

      if (result.success) {
        setIsSuccess(true);
        // 2초 후 체크 아이콘 숨기기
        setTimeout(() => setIsSuccess(false), 2000);

        // 1. TanStack Query 캐시 무효화 (요약 섹션 업데이트)
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
          ]);
        }

        // 2. 에디터 패널이 열려있지 않거나 다른 블록을 편집 중이면 자동으로 열기
        const isEditorPanelOpen =
          canvasMode.isBlockEditingMode() &&
          canvasMode.mode.type === 'block-editing' &&
          canvasMode.mode.blockId === blockId;

        if (!isEditorPanelOpen) {
          const blockMountId = blockData.blockMountId;
          if (blockMountId) {
            canvasMode.enterBlockEditingMode(blockId, blockMountId);
          }
        }
      } else {
        console.error('[useExtractSummary] Failed to extract summary:', result);
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
              result.error || 'An error occurred while extracting the summary.',
          });
        }
      }
    } catch (error) {
      console.error('[useExtractSummary] Error extracting summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [blockId, blockData, youtubeId, queryClient, canvasMode]);

  return {
    extractSummary,
    isLoading,
    isSuccess,
  };
}
