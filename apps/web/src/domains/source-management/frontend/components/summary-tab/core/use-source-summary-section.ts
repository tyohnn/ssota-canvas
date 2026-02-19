/**
 * useSourceSummarySection
 *
 * Source 요약 탭 공통 비즈니스 로직 훅
 * YouTube, Link 등 source를 가진 블록에서 Summary 탭에 사용
 *
 * ## 기본 동작
 * - sourceSummaryAccessLanguages: properties + API 결과 merge
 * - initialTab: Action에서 Summary 탭 열 때 language/isExtracting 전달
 * - considerFetchingJobAsLoading: 패널 재오픈 시 in-progress job fetch 중 로딩 표시
 * - invalidateLanguagesOnMount: 마운트 시 source-summary-languages 재조회
 * - onExtractStart: Extract 클릭 시 setAutoSummaryBlockId (AIActionContext)
 */

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { getInProgressSourceJobByBlockIdAction } from '@/domains/source-management/actions/summary/get-in-progress-source-job-by-block-id.action';
import { processSourceSummaryAction } from '@/domains/source-management/actions/summary/process-source-summary.action';
import type { SourceJob } from '@/domains/source-management/frontend/hooks';
import {
  useSourceJobRealtime,
  useSourceSummary,
  useSourceSummaryLanguages,
} from '@/domains/source-management/frontend/hooks';

import type { SummaryContentDisplay } from './types';

function sourceSummaryToDisplay(
  dto: {
    summary: string;
    keywords: string[];
    language: string;
    updatedAt: Date | string;
    sourceId: string;
  }
): SummaryContentDisplay {
  return {
    summary: dto.summary,
    keywords: dto.keywords ?? [],
  };
}

const languageStateMap = new Map<string, string>();

export interface UseSourceSummarySectionParams {
  /** 쿼리 키 및 languageStateMap 키용 */
  blockSlug: string;
  sourceId: string | undefined;
  /** block.properties에서 읽은 sourceSummaryAccessLanguages (API 결과와 merge) */
  sourceSummaryAccessLanguagesFromProperties?: string[];
}

export interface UseSourceSummarySectionResult {
  summaries: SummaryContentDisplay[];
  availableLanguages: string[];
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  currentSummary: SummaryContentDisplay | null | undefined;
  isLoading: boolean;
  error: string | null;
  handleExtractSummary: (language: string) => Promise<void>;
  isExtracting: boolean;
  hasAccessForSelectedLanguage: boolean;
  sourceSummaryAccessLanguages: string[];
  readonly: boolean;
}

export function useSourceSummarySection({
  blockSlug,
  sourceId,
  sourceSummaryAccessLanguagesFromProperties = [],
}: UseSourceSummarySectionParams): UseSourceSummarySectionResult {
  const [optimisticallyAddedLanguages, setOptimisticallyAddedLanguages] =
    useState<Set<string>>(new Set());
  const canvasMode = useCanvasModeContext();
  const { workspaceId } = useCanvasMetadata();
  const { setAutoSummaryBlockId } = useAIActionContext();
  const { readonly, publishToken } = useCanvasReadOnly();
  const queryClient = useQueryClient();

  const {
    data: inProgressJobData,
    isFetching: isFetchingInProgressJob,
  } = useQuery({
    queryKey: ['source-job-in-progress', blockSlug],
    queryFn: async () => {
      if (!workspaceId) return null;
      const result = await getInProgressSourceJobByBlockIdAction({
        workspaceId,
        blockId: blockSlug,
      });
      return result.success ? result.data : null;
    },
    enabled: !!workspaceId && !!blockSlug && !!sourceId && !readonly,
    staleTime: 5000,
  });

  const initialJob: SourceJob | null =
    inProgressJobData?.job != null
      ? (inProgressJobData.job as SourceJob)
      : null;

  const { isCompleted, isProcessing: isJobProcessing, job } =
    useSourceJobRealtime(blockSlug, initialJob);

  const prevCompletedRef = useRef(false);

  useEffect(() => {
    if (!blockSlug || !sourceId) return;
    if (isCompleted && !prevCompletedRef.current) {
      prevCompletedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['source-summary', blockSlug] });
      queryClient.invalidateQueries({
        queryKey: ['source-summary-languages', blockSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ['source-job-in-progress', blockSlug],
      });
    }
    if (!isCompleted) prevCompletedRef.current = false;
  }, [blockSlug, sourceId, isCompleted, queryClient]);

  const sourceLanguages = useSourceSummaryLanguages({
    blockId: blockSlug,
    ...(readonly && publishToken && sourceId
      ? { sourceId, publishToken, readonly: true as const }
      : {}),
    enabled: !!blockSlug && !!sourceId,
  });

  const availableSummaryLanguages = sourceId ? sourceLanguages.languages : [];
  const isLoadingLanguages = !!sourceId && sourceLanguages.isLoading;
  const languagesError = sourceId ? sourceLanguages.error : null;

  useEffect(() => {
    if (!blockSlug || !sourceId || readonly) return;
    queryClient.invalidateQueries({
      queryKey: ['source-summary-languages', blockSlug],
    });
  }, [blockSlug, sourceId, readonly, queryClient]);

  useEffect(() => {
    if (!isCompleted) return;
    setOptimisticallyAddedLanguages((prev) => {
      const next = new Set(prev);
      availableSummaryLanguages.forEach((lang) => next.delete(lang));
      return next.size === prev.size ? prev : next;
    });
  }, [isCompleted, availableSummaryLanguages]);

  const initialLanguage = useMemo(() => {
    const stored = languageStateMap.get(blockSlug);
    if (stored) return stored;
    const first = availableSummaryLanguages[0];
    return first ?? 'en';
  }, [blockSlug, availableSummaryLanguages]);

  const [selectedLanguage, setSelectedLanguage] =
    useState<string>(initialLanguage);

  useEffect(() => {
    if (isLoadingLanguages) return;
    const stored = languageStateMap.get(blockSlug);
    if (!stored) {
      if (availableSummaryLanguages.length > 0) {
        const firstAvailable = availableSummaryLanguages[0];
        if (firstAvailable && firstAvailable !== selectedLanguage) {
          setSelectedLanguage(firstAvailable);
          languageStateMap.set(blockSlug, firstAvailable);
        }
      }
    } else if (stored !== selectedLanguage) {
      setSelectedLanguage(stored);
    }
  }, [blockSlug, availableSummaryLanguages, isLoadingLanguages, selectedLanguage]);

  useEffect(() => {
    const jobLanguage = job?.language ?? initialJob?.language;
    if (!blockSlug || !jobLanguage) return;
    if (isJobProcessing) {
      languageStateMap.set(blockSlug, jobLanguage);
      setSelectedLanguage(jobLanguage);
    }
  }, [blockSlug, isJobProcessing, job?.language, initialJob?.language]);

  const isEditingThisBlock =
    canvasMode.mode.type === 'block-editing' &&
    canvasMode.mode.blockId === blockSlug;
  const isSummaryTabWithOptions =
    canvasMode.mode.type === 'block-editing' &&
    canvasMode.mode.initialTab?.tab === 'summary' &&
    !!canvasMode.mode.initialTab.tabOptions;

  useEffect(() => {
    if (
      canvasMode.mode.type === 'block-editing' &&
      canvasMode.mode.blockId === blockSlug &&
      canvasMode.mode.initialTab?.tab === 'summary' &&
      canvasMode.mode.initialTab.tabOptions?.language
    ) {
      const language = canvasMode.mode.initialTab.tabOptions
        .language as string;
      languageStateMap.set(blockSlug, language);
      setSelectedLanguage(language);
    }
  }, [canvasMode.mode, blockSlug]);

  const isExtractingFromTabOptions =
    isEditingThisBlock &&
    isSummaryTabWithOptions &&
    canvasMode.mode.type === 'block-editing' &&
    canvasMode.mode.initialTab?.tabOptions?.isExtracting === true;

  const handleSetSelectedLanguage = (language: string) => {
    setSelectedLanguage(language);
    languageStateMap.set(blockSlug, language);
  };

  const isSelectedLanguageInList =
    availableSummaryLanguages.includes(selectedLanguage);
  const isCompletedAndOptimisticallyAdded =
    isCompleted && optimisticallyAddedLanguages.has(selectedLanguage);
  const isCompletedJobForSelectedLanguage =
    isCompleted && job?.language === selectedLanguage;

  const isAlreadyExtracted =
    isSelectedLanguageInList ||
    isCompletedAndOptimisticallyAdded ||
    isCompletedJobForSelectedLanguage;
  const enabledProcessSummary =
    !!blockSlug && !!selectedLanguage && isAlreadyExtracted && !!sourceId;

  const sourceSummary = useSourceSummary({
    blockId: blockSlug,
    language: selectedLanguage,
    ...(readonly && publishToken && sourceId
      ? { sourceId, publishToken, readonly: true as const }
      : {}),
    enabled: enabledProcessSummary,
  });

  const currentSummary: SummaryContentDisplay | undefined =
    sourceId && sourceSummary.summary
      ? sourceSummaryToDisplay(sourceSummary.summary)
      : undefined;
  const isProcessingSummary = !!sourceId && sourceSummary.isLoading;
  const summaryError = sourceId ? sourceSummary.error : null;
  const refetchSummary = sourceId
    ? sourceSummary.refetch
    : () => Promise.resolve();

  const summaryErrorText =
    summaryError == null
      ? ''
      : typeof summaryError === 'string'
        ? summaryError
        : summaryError.message ?? '';
  const isSummaryNotFoundError = summaryErrorText.includes(
    'Source summary not found'
  );
  const isSelectedLanguageNotInList =
    !availableSummaryLanguages.includes(selectedLanguage);
  const shouldTreatAsEmpty =
    isSummaryNotFoundError && isSelectedLanguageNotInList;

  const processSourceMutation = useMutation({
    mutationFn: async (language: string) => {
      if (!workspaceId) throw new Error('Workspace not found');
      const result = await processSourceSummaryAction({
        workspaceId,
        blockId: blockSlug,
        language,
      });
      if (!result.success) throw new Error(result.error);
    },
    onMutate: (language) => {
      setOptimisticallyAddedLanguages((prev) => {
        const next = new Set(prev);
        next.add(language);
        return next;
      });
    },
    onError: (_err, language) => {
      setOptimisticallyAddedLanguages((prev) => {
        const next = new Set(prev);
        next.delete(language);
        return next;
      });
    },
    onSettled: () => {
      refetchSummary();
      queryClient.invalidateQueries({
        queryKey: ['source-summary', blockSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ['source-summary-languages', blockSlug],
      });
    },
  });

  const isExtractingSummary = processSourceMutation.isPending;

  const summaries = currentSummary ? [currentSummary] : [];
  const isLanguagesLoadingWithEmptyList =
    isLoadingLanguages && availableSummaryLanguages.length === 0;
  const finalCurrentSummary = isLanguagesLoadingWithEmptyList
    ? undefined
    : shouldTreatAsEmpty
      ? null
      : isAlreadyExtracted
        ? currentSummary
        : null;

  const rawError = shouldTreatAsEmpty
    ? languagesError ?? null
    : languagesError || (isAlreadyExtracted ? summaryError : null);
  const hasBlockButNoSource = !sourceId && !!blockSlug;
  const defaultNoSourceMessage = 'Please enter a URL and load metadata.';
  const error: string | null =
    rawError != null
      ? typeof rawError === 'string'
        ? rawError
        : rawError.message
      : hasBlockButNoSource
        ? defaultNoSourceMessage
        : null;

  const handleExtractSummary = async (language: string): Promise<void> => {
    if (readonly) return;
    if (!blockSlug) return;
    if (!sourceId) return;
    setAutoSummaryBlockId(blockSlug);
    processSourceMutation.mutate(language);
  };

  const isSummaryContentLoading =
    !shouldTreatAsEmpty &&
    isAlreadyExtracted &&
    currentSummary === undefined &&
    (isProcessingSummary ||
      (isCompleted && optimisticallyAddedLanguages.size > 0)) &&
    !isExtractingSummary;
  const isPanelReopenFetchingJob =
    !!blockSlug && !!sourceId && !readonly && isFetchingInProgressJob;
  const isLoading =
    isLoadingLanguages ||
    isPanelReopenFetchingJob ||
    isSummaryContentLoading ||
    isExtractingFromTabOptions;

  const mergedSourceSummaryAccessLanguages = useMemo(() => {
    const base = sourceSummaryAccessLanguagesFromProperties ?? [];
    const merged = new Set([...base, ...availableSummaryLanguages]);
    return Array.from(merged);
  }, [sourceSummaryAccessLanguagesFromProperties, availableSummaryLanguages]);

  const isJobProcessingForSelectedLanguage =
    !!isJobProcessing && job?.language === selectedLanguage;
  const isOptimisticExtractForSelectedLanguage =
    optimisticallyAddedLanguages.has(selectedLanguage) &&
    isSelectedLanguageNotInList;
  const isExtracting =
    isExtractingSummary ||
    isExtractingFromTabOptions ||
    isJobProcessingForSelectedLanguage ||
    isOptimisticExtractForSelectedLanguage;

  return {
    summaries,
    availableLanguages: availableSummaryLanguages,
    selectedLanguage,
    setSelectedLanguage: handleSetSelectedLanguage,
    currentSummary: finalCurrentSummary,
    isLoading,
    error,
    handleExtractSummary,
    isExtracting,
    hasAccessForSelectedLanguage: shouldTreatAsEmpty ? false : isAlreadyExtracted,
    sourceSummaryAccessLanguages: mergedSourceSummaryAccessLanguages,
    readonly,
  };
}
