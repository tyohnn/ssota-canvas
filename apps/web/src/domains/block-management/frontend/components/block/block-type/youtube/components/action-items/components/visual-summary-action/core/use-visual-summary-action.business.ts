/**
 * Visual Summary Action Business Hook
 *
 * sourceId 있을 때만 source-management 훅(useSourceSummaryLanguages, useSourceSummary) 사용.
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { useSourceSummary, useSourceSummaryLanguages } from '@/domains/source-management/frontend/hooks';
import type { VisualTemplate } from '@/domains/ai-actions/shared/types/template.types';
import type { QueueTodo } from '@workspace/ui/components/ai-elements/queue';

export interface VisualSummaryActionBusinessReturn {
  videoSummary: { summary: string } | null | undefined;
  isSummaryLoading: boolean;
  summaryError: string | null;
  isGenerating: boolean;
  visualSummaryError: Error | null;
  messages: any[];
  todos: QueueTodo[];
  handleTemplateSelect: (template: VisualTemplate) => boolean;
}

interface UseVisualSummaryActionBusinessProps {
  pageId: string;
  blockId: string;
  sourceBlockPosition: { x: number; y: number };
  sourceBlockSize: { width: number; height: number };
  youtubeId: string | undefined;
  sourceId: string | undefined;
  selectedLanguage: string;
  readonly: boolean;
  publishToken?: string;
  sourceTitle?: string;
  sourceChannelName?: string;
}

export function useVisualSummaryActionBusiness(
  props: UseVisualSummaryActionBusinessProps
): VisualSummaryActionBusinessReturn {
  const {
    blockId,
    sourceBlockPosition,
    sourceBlockSize,
    youtubeId,
    sourceId,
    selectedLanguage,
    readonly,
    publishToken,
    sourceTitle,
    sourceChannelName,
  } = props;

  const {
    languages: availableSummaryLanguages,
    isLoading: isLoadingLanguages,
  } = useSourceSummaryLanguages({
    blockId,
    ...(readonly && publishToken && sourceId
      ? { sourceId, publishToken, readonly: true as const }
      : sourceId
        ? { sourceId }
        : {}),
    enabled: !!blockId && !!sourceId,
  });

  const languageToFetch = useMemo(() => {
    if (availableSummaryLanguages.length > 0 && availableSummaryLanguages[0]) {
      return availableSummaryLanguages[0];
    }
    return selectedLanguage;
  }, [availableSummaryLanguages, selectedLanguage]);

  const hasAnySummary = availableSummaryLanguages.length > 0;

  const {
    summary: sourceSummaryDto,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useSourceSummary({
    blockId,
    language: languageToFetch,
    ...(readonly && publishToken && sourceId
      ? { sourceId, publishToken, readonly: true as const }
      : sourceId
        ? { sourceId }
        : {}),
    enabled: !!sourceId && hasAnySummary,
  });

  const videoSummary = sourceSummaryDto?.summary
    ? { summary: sourceSummaryDto.summary }
    : sourceSummaryDto;

  const {
    generateVisualSummary: generateVisualSummaryFromContext,
    isGenerating,
    jobs,
    messages,
  } = useAIActionContext();

  const visualSummaryJob = useMemo(
    () =>
      jobs.find(
        (j) => j.type === 'visual-summary' && j.sourceBlockId === blockId
      ),
    [jobs, blockId]
  );
  const visualSummaryError =
    visualSummaryJob?.status === 'failed' ? visualSummaryJob.error ?? null : null;
  const todos = visualSummaryJob?.tasks ?? [];

  const handleTemplateSelect = useCallback(
    (template: VisualTemplate): boolean => {
      if (!videoSummary?.summary) {
        console.warn(
          '[VisualSummaryAction] No video summary available. Please extract summary first.'
        );
        return false;
      }
      if (!youtubeId) {
        console.warn('[VisualSummaryAction] YouTube ID not available');
        return false;
      }
      generateVisualSummaryFromContext({
        summary: videoSummary.summary,
        template,
        sourceBlockId: blockId,
        sourceBlockPosition,
        sourceBlockSize,
        sourceTitle,
        sourceChannelName,
      });
      return true;
    },
    [videoSummary, youtubeId, generateVisualSummaryFromContext, blockId, sourceBlockPosition, sourceBlockSize, sourceTitle, sourceChannelName]
  );

  return {
    videoSummary: sourceId ? videoSummary : null,
    isSummaryLoading: isSummaryLoading || (isLoadingLanguages && availableSummaryLanguages.length === 0),
    summaryError: summaryError ? summaryError.message : null,
    isGenerating,
    visualSummaryError,
    messages,
    todos,
    handleTemplateSelect,
  };
}
