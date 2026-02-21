/**
 * Script Section Business Logic Hook
 *
 * 스크립트 표시: sources.raw_content (JSON or legacy [MM:SS] format)
 * - 타임스탬프 클릭, TOC, 인용 등 UI 기능용
 * 스크립트 추출: extractSourceContentAction → sources.raw_content + videos.script dual-write
 *
 * ✅ sourceId 있을 때만 추출 가능. 없으면 안내 메시지.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { parseTimelineRawContent } from '@/domains/source-management/shared/parse-timeline-raw-content';
import { getInProgressSourceJobByBlockIdAction } from '@/domains/source-management/actions/summary/get-in-progress-source-job-by-block-id.action';
import { extractSourceContentAction } from '@/domains/source-management/actions/source/extract-source-content.action';
import { useSourceContent } from '@/domains/source-management/frontend/hooks';
import type { SourceJob } from '@/domains/source-management/frontend/hooks';
import { useSourceJobRealtime } from '@/domains/source-management/frontend/hooks';

import type { ScriptSectionBusinessLogic } from './types';

/**
 * Script Section Business Logic Hook
 *
 * useSourceContent: sources.raw_content 조회 → parseTimelineRawContent로 구조화
 * extractSourceContentAction: 추출 요청 (source + video dual-write)
 */
export function useScriptSectionBusiness(
  blockId: string,
  blockData: BlockNodeData | undefined
): ScriptSectionBusinessLogic {
  const { workspaceId } = useCanvasMetadata();
  const properties = blockData?.properties as
    | YoutubeBlockProperties
    | undefined;

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

  const sourceId = blockData?.sourceId;

  const { data: inProgressJobData } = useQuery({
    queryKey: ['source-job-in-progress', blockId],
    queryFn: async () => {
      if (!workspaceId || !blockId || !sourceId) return null;
      const result = await getInProgressSourceJobByBlockIdAction({
        workspaceId,
        blockId,
      });
      return result.success ? result.data : null;
    },
    enabled: !!workspaceId && !!blockId && !!sourceId,
    staleTime: 5000,
  });

  const initialJob: SourceJob | null =
    inProgressJobData?.job != null
      ? (inProgressJobData.job as SourceJob)
      : null;

  // sources.raw_content 조회 → parseTimelineRawContent로 구조화
  const sourceContent = useSourceContent({
    blockId,
    enabled: !!blockId && !!sourceId && !!youtubeId,
  });

  const script = sourceContent.content?.rawContent
    ? parseTimelineRawContent(sourceContent.content.rawContent) ?? undefined
    : undefined;
  const extractedAt = sourceContent.content?.extractedAt ?? undefined;
  const isLoadingScript = !!youtubeId && !!sourceId && sourceContent.isLoading;
  const scriptError = youtubeId && sourceId ? sourceContent.error : null;

  const queryClient = useQueryClient();
  const { isCompleted } = useSourceJobRealtime(
    initialJob?.block_id ?? blockId ?? '',
    initialJob
  );
  const prevCompletedRef = useRef(false);

  // Realtime: source job 완료 시 source-content 캐시 무효화
  useEffect(() => {
    if (!blockId || !sourceId) return;
    if (isCompleted && !prevCompletedRef.current) {
      prevCompletedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['source-content', blockId] });
    }
    if (!isCompleted) prevCompletedRef.current = false;
  }, [blockId, sourceId, isCompleted, queryClient]);

  const extractMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!blockId) throw new Error('Block ID not found');
      if (!sourceId) throw new Error('Please enter a URL and load metadata before extracting the script.');
      if (!workspaceId) throw new Error('Workspace not found');
      const result = await extractSourceContentAction({ workspaceId, blockId });
      if (!result.success) {
        throw new Error(result.error || 'Failed to extract script');
      }
    },
    onSuccess: async () => {
      if (blockId) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['source-content', blockId],
          }),
          queryClient.invalidateQueries({
            queryKey: ['source-job-in-progress', blockId],
          }),
        ]);
      }
    },
  });

  const handleExtractScript = async (): Promise<void> => {
    if (!sourceId) return;
    if (!blockId) return;
    extractMutation.mutate();
  };

  const error = scriptError
    ? scriptError.message
    : !sourceId && blockId
      ? 'Please enter a URL and load metadata.'
      : null;

  return {
    youtubeId,
    youtubeTitle,
    script,
    extractedAt,
    isLoading: isLoadingScript,
    error,
    handleExtractScript,
    isExtracting: extractMutation.isPending,
  };
}
