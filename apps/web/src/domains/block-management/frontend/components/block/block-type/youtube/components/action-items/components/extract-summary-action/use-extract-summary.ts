'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { toast } from '@workspace/ui/components/ui/sonner';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { createTabOptions } from '@/domains/canvas-management/frontend/hooks/mode/create-tab-options';
import { useSourceJobRealtime } from '@/domains/source-management/frontend/hooks';

import { extractSummaryAction } from './extract-summary-action.business';

async function invalidateSummaryQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  blockId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['source-summary', blockId] }),
    queryClient.invalidateQueries({
      queryKey: ['source-summary-languages', blockId],
    }),
  ]);
}

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
  const { setAutoSummaryBlockId } = useAIActionContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const waitingForJobRef = useRef(false);
  const clearExtractingRef = useRef<(() => void) | null>(null);

  const { isCompleted, isFailed } = useSourceJobRealtime(blockId, null);

  useEffect(() => {
    if (!waitingForJobRef.current) return;
    if (isCompleted) {
      waitingForJobRef.current = false;
      invalidateSummaryQueries(queryClient, blockId);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
      setIsLoading(false);
      clearExtractingRef.current?.();
    } else if (isFailed) {
      waitingForJobRef.current = false;
      toast.error('Failed to extract summary', {
        description: 'The extraction job failed. Please try again.',
      });
      setIsLoading(false);
      clearExtractingRef.current?.();
    }
  }, [isCompleted, isFailed, queryClient, blockId]);

  const sourceId = blockData?.sourceId;

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
      clearExtractingRef.current = clearExtracting;

      try {
        const result = await extractSummaryAction(blockId, blockData, language);

        if (result.success) {
          if (result.alreadyExists) {
            if (sourceId) {
              await invalidateSummaryQueries(queryClient, blockId);
            }
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);
            clearExtracting();
            setIsLoading(false);
          } else {
            waitingForJobRef.current = true;
            // Status Window에 job 등록 + Realtime 구독으로 진행 상태 표시
            setAutoSummaryBlockId(blockId);
          }
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
          setIsLoading(false);
        }
      } catch (error) {
        clearExtracting();
        console.error('[useExtractSummary] Error extracting summary:', error);
        setIsLoading(false);
      }
    },
    [blockId, blockData, sourceId, queryClient, canvasMode, setAutoSummaryBlockId]
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
