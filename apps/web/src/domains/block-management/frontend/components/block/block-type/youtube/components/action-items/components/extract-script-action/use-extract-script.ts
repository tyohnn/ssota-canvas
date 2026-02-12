'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { toast } from '@workspace/ui/components/ui/sonner';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { useSourceJobRealtime } from '@/domains/source-management/frontend/hooks';

import { extractScriptAction } from './extract-script-action.business';

interface UseExtractScriptParams {
  blockId: string;
  blockData: BlockNodeData;
}

async function invalidateScriptQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  blockId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['source-content', blockId] }),
  ]);
}

export function useExtractScript({
  blockId,
  blockData,
}: UseExtractScriptParams) {
  const queryClient = useQueryClient();
  const canvasMode = useCanvasModeContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const waitingForJobRef = useRef(false);

  const { isCompleted, isFailed } = useSourceJobRealtime(blockId, null);

  useEffect(() => {
    if (!waitingForJobRef.current) return;
    if (isCompleted) {
      waitingForJobRef.current = false;
      invalidateScriptQueries(queryClient, blockId);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
      setIsLoading(false);
    } else if (isFailed) {
      waitingForJobRef.current = false;
      toast.error('Failed to extract script', {
        description: 'The extraction job failed. Please try again.',
      });
      setIsLoading(false);
    }
  }, [isCompleted, isFailed, queryClient, blockId]);

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
        '[useExtractScript] Failed to parse YouTube properties:',
        error
      );
    }
    return undefined;
  })();

  const extractScript = useCallback(async () => {
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const result = await extractScriptAction(blockId, blockData);

      if (result.success) {
        if (result.alreadyExists) {
          await invalidateScriptQueries(queryClient, blockId);
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 2000);
          setIsLoading(false);
        } else {
          waitingForJobRef.current = true;
        }

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
        console.error('[useExtractScript] Failed to extract script:', result);
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
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[useExtractScript] Error extracting script:', error);
      setIsLoading(false);
    }
  }, [blockId, blockData, queryClient, canvasMode]);

  return {
    extractScript,
    isLoading,
    isSuccess,
  };
}
