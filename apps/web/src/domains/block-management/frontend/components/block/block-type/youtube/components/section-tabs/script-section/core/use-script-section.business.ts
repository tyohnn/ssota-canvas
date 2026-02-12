/**
 * Script Section Business Logic Hook
 *
 * 스크립트 표시: youtube_app_space.videos.script (구조화 transcript)
 * - 타임스탬프 클릭, TOC, 인용 등 UI 기능용
 * 스크립트 추출: extractSourceContentAction → sources.raw_content + videos.script dual-write
 *
 * ✅ sourceId 있을 때만 추출 가능. 없으면 안내 메시지.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { extractSourceContentAction } from '@/domains/source-management/actions/source/extract-source-content.action';
import { useSourceJobRealtime } from '@/domains/source-management/frontend/hooks';
import { useVideoScript } from '@/domains/youtube-app-space/frontend/hooks';

import type { ScriptSectionBusinessLogic } from './types';

/**
 * Script Section Business Logic Hook
 *
 * useVideoScript: youtube_app_space.videos.script 조회 (구조화 transcript)
 * extractSourceContentAction: 추출 요청 (source + video dual-write)
 */
export function useScriptSectionBusiness(
  blockId: string,
  blockData: BlockNodeData | undefined
): ScriptSectionBusinessLogic {
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

  // youtube_app_space.videos.script 조회 (구조화 transcript, 타임스탬프/TOC/인용용)
  const videoScript = useVideoScript({
    blockId,
    enabled: !!blockId && !!youtubeId,
  });

  const script = videoScript.script ?? undefined;
  const isLoadingScript = !!youtubeId && videoScript.isLoading;
  const scriptError = youtubeId ? videoScript.error : null;

  const queryClient = useQueryClient();
  const { isCompleted } = useSourceJobRealtime(blockId ?? '', null);
  const prevCompletedRef = useRef(false);

  // Realtime: source job 완료 시 video-script 캐시 무효화
  useEffect(() => {
    if (!blockId || !sourceId) return;
    if (isCompleted && !prevCompletedRef.current) {
      prevCompletedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['video-script', blockId] });
    }
    if (!isCompleted) prevCompletedRef.current = false;
  }, [blockId, sourceId, isCompleted, queryClient]);

  const extractMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!blockId) throw new Error('Block ID not found');
      if (!sourceId) throw new Error('Please enter a URL and load metadata before extracting the script.');
      const result = await extractSourceContentAction({ blockId });
      if (!result.success) {
        throw new Error(result.error || 'Failed to extract script');
      }
    },
    onSuccess: async () => {
      if (blockId) {
        await queryClient.invalidateQueries({
          queryKey: ['video-script', blockId],
        });
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
    isLoading: isLoadingScript,
    error,
    handleExtractScript,
    isExtracting: extractMutation.isPending,
  };
}
