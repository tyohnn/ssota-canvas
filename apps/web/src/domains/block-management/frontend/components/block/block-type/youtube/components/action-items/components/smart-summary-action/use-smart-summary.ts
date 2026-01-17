'use client';

import { useCallback, useState } from 'react';

import { toast } from '@workspace/ui/components/ui/sonner';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { executeSmartSummaryAction } from './smart-summary-action.business';

interface UseSmartSummaryParams {
  blockId: string;
  blockData: BlockNodeData;
}

export function useSmartSummary({ blockId, blockData }: UseSmartSummaryParams) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const smartSummary = useCallback(async () => {
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const result = await executeSmartSummaryAction(blockId, blockData);

      if (result.success) {
        setIsSuccess(true);
        // 2초 후 체크 아이콘 숨기기 (extract-script-action 패턴)
        setTimeout(() => setIsSuccess(false), 2000);
      } else {
        console.error('[useSmartSummary] Failed to summarize video:', result);
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
          toast.error('Failed to generate summary', {
            description:
              result.error || 'An error occurred while generating the summary.',
          });
        }
      }
    } catch (error) {
      console.error('[useSmartSummary] Error summarizing video:', error);
    } finally {
      setIsLoading(false);
    }
  }, [blockId, blockData]);

  return {
    smartSummary,
    isLoading,
    isSuccess,
  };
}
