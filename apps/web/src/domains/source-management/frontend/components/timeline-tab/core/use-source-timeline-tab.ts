/**
 * useSourceTimelineTab
 *
 * Source 타임라인 탭 공통 비즈니스 로직 훅
 * YouTube, Link 등 source를 가진 블록에서 Timeline 탭에 사용
 */

'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { parseTimelineRawContent } from '@/domains/source-management/shared/parse-timeline-raw-content';
import {
  useExtractSourceContent,
  useInProgressSourceJob,
  useSourceContent,
  useSourceJobRealtime,
  type SourceJob,
} from '@/domains/source-management/frontend/hooks';

import type {
  UseSourceTimelineTabParams,
  UseSourceTimelineTabResult,
} from './types';

export function useSourceTimelineTab({
  blockSlug,
  sourceId,
  sourceTitle,
}: UseSourceTimelineTabParams): UseSourceTimelineTabResult {
  const { workspaceId } = useCanvasMetadata();

  const { data: inProgressJobData } = useInProgressSourceJob({
    blockSlug,
    sourceId,
    workspaceId,
  });

  const initialJob: SourceJob | null =
    inProgressJobData?.job != null
      ? (inProgressJobData.job as SourceJob)
      : null;

  const sourceContent = useSourceContent({
    blockId: blockSlug,
    enabled: !!blockSlug && !!sourceId,
  });

  const rawContent = sourceContent.content?.rawContent;
  const script = rawContent
    ? parseTimelineRawContent(rawContent) ?? undefined
    : undefined;
  const extractedAt = sourceContent.content?.extractedAt ?? undefined;
  const isLoadingScript = !!sourceId && sourceContent.isLoading;
  const scriptError = sourceId ? sourceContent.error : null;

  const queryClient = useQueryClient();
  const { isCompleted } = useSourceJobRealtime(
    initialJob?.block_id ?? blockSlug ?? '',
    initialJob
  );
  const prevCompletedRef = useRef(false);

  useEffect(() => {
    if (!blockSlug || !sourceId) return;
    if (isCompleted && !prevCompletedRef.current) {
      prevCompletedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['source-content', blockSlug] });
    }
    if (!isCompleted) prevCompletedRef.current = false;
  }, [blockSlug, sourceId, isCompleted, queryClient]);

  const { extract, isExtracting } = useExtractSourceContent({
    blockSlug,
    sourceId,
    workspaceId,
  });

  const error = scriptError
    ? scriptError.message
    : !sourceId && blockSlug
      ? 'Please enter a URL and load metadata.'
      : null;

  const handleExtractScript = async (): Promise<void> => {
    await extract();
  };

  return {
    sourceTitle,
    script,
    extractedAt,
    isLoading: isLoadingScript,
    error,
    handleExtractScript,
    isExtracting,
  };
}
