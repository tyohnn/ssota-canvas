'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { toast } from '@workspace/ui/components/ui/sonner';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
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

export interface UseExtractSummaryParams {
  blockType: BlockType;
  blockId: string;
  blockData: BlockNodeData;
}

export function useExtractSummary({
  blockType,
  blockId,
  blockData,
}: UseExtractSummaryParams) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCanvasMetadata();
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

      const blockMountId = blockData.blockMountId;
      if (blockMountId) {
        canvasMode.enterBlockEditingMode(
          blockId,
          blockMountId,
          createTabOptions(blockType as 'youtube' | 'link', 'summary', {
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
        const result = await extractSummaryAction(
          workspaceId ?? '',
          blockId,
          blockData,
          language
        );

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
            setAutoSummaryBlockId(blockId);
          }
        } else {
          clearExtracting();
          if (
            result.error?.includes('Block not found') ||
            result.error?.includes('Access denied') ||
            result.error?.includes('authority') ||
            result.error?.includes('permission')
          ) {
            toast.error("You don't have authority", {
              description: result.error || "You don't have permission to perform this action.",
            });
          } else {
            toast.error('Failed to extract summary', {
              description: result.error || 'An error occurred while extracting the summary.',
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
    [blockType, blockId, blockData, sourceId, queryClient, canvasMode, setAutoSummaryBlockId]
  );

  const openSummaryTab = useCallback(
    (language: string) => {
      const blockMountId = blockData.blockMountId;
      if (blockMountId) {
        canvasMode.enterBlockEditingMode(
          blockId,
          blockMountId,
          createTabOptions(blockType as 'youtube' | 'link', 'summary', { language })
        );
      }
    },
    [blockType, blockId, blockData, canvasMode]
  );

  return {
    extractSummary,
    openSummaryTab,
    isLoading,
    isSuccess,
  };
}
