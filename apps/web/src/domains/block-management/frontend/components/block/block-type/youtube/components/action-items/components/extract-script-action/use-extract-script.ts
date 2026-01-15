'use client';

import { useCallback, useState } from 'react';

import { toast } from '@workspace/ui/components/ui/sonner';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { extractScriptAction } from './extract-script-action.business';

interface UseExtractScriptParams {
  blockId: string;
  blockData: BlockNodeData;
}

export function useExtractScript({
  blockId,
  blockData,
}: UseExtractScriptParams) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const extractScript = useCallback(async () => {
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const result = await extractScriptAction(blockId, blockData);

      if (result.success) {
        setIsSuccess(true);
        // 2초 후 체크 아이콘 숨기기 (copy-youtube-link-toolbar-item.tsx 패턴)
        setTimeout(() => setIsSuccess(false), 2000);
      } else {
        console.error('[useExtractScript] Failed to extract script:', result);
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
          toast.error('Failed to extract script', {
            description:
              result.error || 'An error occurred while extracting the script.',
          });
        }
      }
    } catch (error) {
      console.error('[useExtractScript] Error extracting script:', error);
    } finally {
      setIsLoading(false);
    }
  }, [blockId, blockData]);

  return {
    extractScript,
    isLoading,
    isSuccess,
  };
}
