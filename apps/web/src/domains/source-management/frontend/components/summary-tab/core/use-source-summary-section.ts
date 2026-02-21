/**
 * useSourceSummarySection
 *
 * Source 요약 탭 공통 비즈니스 로직 훅
 * YouTube, Link 등 source를 가진 블록에서 Summary 탭에 사용
 *
 * 오케스트레이터: useSourceJobForBlock, useSummaryLanguages, useSummaryContent, useSummaryExtractMutation 조합
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import type { SummaryContentDisplay } from './types';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';

import { useSourceJobForBlock } from './use-source-job-for-block';
import { useSummaryContent } from './use-summary-content';
import { useSummaryExtractMutation } from './use-summary-extract-mutation';
import { useSummaryLanguages } from './use-summary-languages';


function toErrorString(e: Error | string | null): string {
  if (e == null) return '';
  return typeof e === 'string' ? e : (e as Error).message ?? '';
}

function getShouldTreatAsEmpty(
  contentError: unknown,
  isSelectedLanguageInList: boolean
): boolean {
  return (
    !isSelectedLanguageInList &&
    toErrorString(contentError as Error | string | null).includes(
      'Source summary not found'
    )
  );
}

function getFinalCurrentSummary(params: {
  isLanguagesLoadingWithEmptyList: boolean;
  shouldTreatAsEmpty: boolean;
  isAlreadyExtracted: boolean;
  contentLoading: boolean;
  currentSummary: SummaryContentDisplay | null | undefined;
}): SummaryContentDisplay | null | undefined {
  const {
    isLanguagesLoadingWithEmptyList,
    shouldTreatAsEmpty,
    isAlreadyExtracted,
    contentLoading,
    currentSummary,
  } = params;
  if (isLanguagesLoadingWithEmptyList) return undefined;
  if (shouldTreatAsEmpty) return null;
  if (!isAlreadyExtracted) return null;
  return contentLoading && currentSummary === undefined
    ? undefined
    : (currentSummary ?? null);
}

function getDisplayError(params: {
  shouldTreatAsEmpty: boolean;
  languagesError: unknown;
  isAlreadyExtracted: boolean;
  contentError: unknown;
  sourceId: string | undefined;
  blockSlug: string;
}): string | null {
  const {
    shouldTreatAsEmpty,
    languagesError,
    isAlreadyExtracted,
    contentError,
    sourceId,
    blockSlug,
  } = params;
  const rawError = shouldTreatAsEmpty
    ? languagesError ?? null
    : languagesError || (isAlreadyExtracted ? contentError : null);
  if (rawError != null) {
    return typeof rawError === 'string'
      ? rawError
      : (rawError as Error).message ?? null;
  }
  return !sourceId && !!blockSlug
    ? 'Please enter a URL and load metadata.'
    : null;
}

function getIsSummaryContentLoading(params: {
  shouldTreatAsEmpty: boolean;
  isAlreadyExtracted: boolean;
  currentSummary: SummaryContentDisplay | null | undefined;
  contentLoading: boolean;
  isCompleted: boolean;
  optimisticallyAddedLanguagesSize: number;
  isExtractingSummary: boolean;
}): boolean {
  const {
    shouldTreatAsEmpty,
    isAlreadyExtracted,
    currentSummary,
    contentLoading,
    isCompleted,
    optimisticallyAddedLanguagesSize,
    isExtractingSummary,
  } = params;
  return (
    !shouldTreatAsEmpty &&
    isAlreadyExtracted &&
    currentSummary === undefined &&
    (contentLoading || (isCompleted && optimisticallyAddedLanguagesSize > 0)) &&
    !isExtractingSummary
  );
}

function getIsLoading(params: {
  languagesLoadingLanguages: boolean;
  isPanelReopenFetchingJob: boolean;
  isSummaryContentLoading: boolean;
  isInitialFetchAfterPanelOpen: boolean;
  isExtractingFromTabOptions: boolean;
}): boolean {
  return (
    params.languagesLoadingLanguages ||
    params.isPanelReopenFetchingJob ||
    params.isSummaryContentLoading ||
    params.isInitialFetchAfterPanelOpen ||
    params.isExtractingFromTabOptions
  );
}

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
  /**
   * optimisticallyAddedLanguages: Extract 버튼 클릭 시 API 완료 전에 "이 언어는 곧 추출됨"으로 간주하는 Set
   *
   * - 추가: Extract mutation 호출 시 onAddOptimisticLanguage로 언어 추가
   * - 제거: Job 완료 시 useEffect에서 availableLanguages + job.language 기준으로 제거
   * - isExtracting(generating UI)에 영향: isOptimisticExtractForSelectedLanguage가 true가 되면 generating 표시
   * - Realtime job 완료 시점에 availableLanguages refetch가 아직 안 끝났을 수 있어,
   *   job.language를 별도로 제거해 generating이 바로 해제되도록 함 (원래는 availableLanguages refetch 대기 후 해제되는 방식이었음)
   */
  const [optimisticallyAddedLanguages, setOptimisticallyAddedLanguages] =
    useState<Set<string>>(new Set());

  const { workspaceId } = useCanvasMetadata();
  const canvasMode = useCanvasModeContext();
  const { readonly, publishToken } = useCanvasReadOnly();

  // 2. Job 완료 시 tabOptions.isExtracting 해제 (AI status 패널 "Generating" 종료)
  const onJobCompleted = useCallback(() => {
    if (canvasMode.mode.type !== 'block-editing') return;
    canvasMode.updateBlockEditingTabOptions(
      { isExtracting: false },
      { blockId: blockSlug, blockMountId: canvasMode.mode.blockMountId }
    );
  }, [canvasMode, blockSlug]);

  // 3. Job 상태 조회 + Realtime 구독 (패널 재오픈, 블록 액션 버튼 시나리오 대응)
  const {
    job,
    initialJob,
    isCompleted,
    isProcessing: isJobProcessing,
    isFetchingInProgressJob,
  } = useSourceJobForBlock({
    blockSlug,
    sourceId: sourceId ?? undefined,
    workspaceId,
    readonly,
    onJobCompleted,
  });

  // 4. 블록 액션 버튼 등에서 Summary 탭 진입 시 지정된 언어
  const initialTabLanguage =
    canvasMode.mode.type === 'block-editing' &&
      canvasMode.mode.blockId === blockSlug &&
      canvasMode.mode.initialTab?.tab === 'summary' &&
      canvasMode.mode.initialTab.tabOptions?.language
      ? (canvasMode.mode.initialTab.tabOptions.language as string)
      : undefined;

  // 5. 언어 목록 + 선택 상태 + job/initialTab과의 동기화
  const languages = useSummaryLanguages({
    blockSlug,
    workspaceId,
    sourceId,
    readonly,
    publishToken,
    job,
    initialJob,
    isJobProcessing,
    initialTabLanguage,
  });

  // 6. 선택된 언어가 이미 추출되었는지 판단 (3가지 경로)
  const isSelectedLanguageInList = languages.availableLanguages.includes(
    languages.selectedLanguage
  );
  const isCompletedAndOptimisticallyAdded =
    isCompleted && optimisticallyAddedLanguages.has(languages.selectedLanguage);
  const isCompletedJobForSelectedLanguage =
    isCompleted && job?.language === languages.selectedLanguage;
  const isAlreadyExtracted =
    isSelectedLanguageInList ||
    isCompletedAndOptimisticallyAdded ||
    isCompletedJobForSelectedLanguage;

  // 7. 선택된 언어의 요약 내용 조회 (isAlreadyExtracted일 때만 API 호출)
  const content = useSummaryContent({
    blockSlug,
    sourceId,
    selectedLanguage: languages.selectedLanguage,
    isAlreadyExtracted,
    readonly,
    publishToken,
  });

  // 8. Extract mutation + setAutoSummaryBlockId(blockUuid) + 낙관적 언어 추가/제거
  const extractMutation = useSummaryExtractMutation({
    blockSlug,
    sourceId,
    onAddOptimisticLanguage: (lang) =>
      setOptimisticallyAddedLanguages((prev) => new Set(prev).add(lang)),
    onRemoveOptimisticLanguage: (lang) =>
      setOptimisticallyAddedLanguages((prev) => {
        const next = new Set(prev);
        next.delete(lang);
        return next;
      }),
    refetchSummary: content.refetch,
  });

  /**
   * 9. Job 완료 시 optimisticallyAddedLanguages에서 제거 → isExtracting(generating) 해제
   *
   * Extract 버튼 클릭 시 onAddOptimisticLanguage로 해당 언어를 optimisticallyAddedLanguages에 추가해
   * "이 언어는 추출 중"으로 표시(Generating)한다. Job이 완료되면 더 이상 낙관적으로 간주할 필요가 없으므로
   * Set에서 제거해야 한다.
   *
   * 제거 기준:
   * - languages.availableLanguages: useSummaryLanguages가 refetch한 결과. 새로 추출된 언어가 여기에 포함되면
   *   "이미 추출됨"이므로 낙관 Set에서 제거.
   * - job?.language: Realtime으로 job 완료를 받았지만 availableLanguages refetch가 아직 끝나지 않았을 수 있다.
   *   이 경우 job.language를 별도로 제거해, refetch 대기 없이 즉시 generating 해제.
   *
   * next.size === prev.size ? prev : next: 아무것도 제거되지 않았으면 prev 참조를 그대로 반환해
   * 불필요한 re-render를 막는다.
   */
  useEffect(() => {
    if (!isCompleted) return;
    setOptimisticallyAddedLanguages((prev) => {
      const next = new Set(prev);
      languages.availableLanguages.forEach((lang) => next.delete(lang));
      if (job?.language) next.delete(job.language);
      return next.size === prev.size ? prev : next;
    });
  }, [isCompleted, job?.language, languages.availableLanguages]);

  const isExtractingSummary = extractMutation.isPending;
  const summaries = content.currentSummary ? [content.currentSummary] : [];

  const isLanguagesLoadingWithEmptyList =
    languages.isLoadingLanguages && languages.availableLanguages.length === 0;
  const shouldTreatAsEmpty =
    getShouldTreatAsEmpty(content.error, isSelectedLanguageInList) &&
    !isCompletedJobForSelectedLanguage;

  const finalCurrentSummary = getFinalCurrentSummary({
    isLanguagesLoadingWithEmptyList,
    shouldTreatAsEmpty,
    isAlreadyExtracted,
    contentLoading: content.isLoading,
    currentSummary: content.currentSummary,
  });

  const error = getDisplayError({
    shouldTreatAsEmpty,
    languagesError: languages.languagesError,
    isAlreadyExtracted,
    contentError: content.error,
    sourceId,
    blockSlug,
  });

  // 11. Extract 핸들러: readonly/유효성 검사 후 mutation 호출
  const handleExtractSummary = async (language: string): Promise<void> => {
    if (readonly) return;
    if (!blockSlug || !sourceId) return;
    extractMutation.mutate(language);
  };

  const isSummaryContentLoading = getIsSummaryContentLoading({
    shouldTreatAsEmpty,
    isAlreadyExtracted,
    currentSummary: content.currentSummary,
    contentLoading: content.isLoading,
    isCompleted,
    optimisticallyAddedLanguagesSize: optimisticallyAddedLanguages.size,
    isExtractingSummary,
  });

  const isEditingThisBlock =
    canvasMode.mode.type === 'block-editing' &&
    canvasMode.mode.blockId === blockSlug;
  const isExtractingFromTabOptions =
    isEditingThisBlock &&
    canvasMode.mode.type === 'block-editing' &&
    canvasMode.mode.initialTab?.tab === 'summary' &&
    canvasMode.mode.initialTab?.tabOptions?.isExtracting === true;

  const isPanelReopenFetchingJob =
    !!blockSlug && !!sourceId && !readonly && isFetchingInProgressJob;
  const isInitialFetchAfterPanelOpen =
    !!blockSlug &&
    !!sourceId &&
    !shouldTreatAsEmpty &&
    finalCurrentSummary === undefined &&
    !languages.languagesError;

  const isLoading = getIsLoading({
    languagesLoadingLanguages: languages.isLoadingLanguages,
    isPanelReopenFetchingJob,
    isSummaryContentLoading,
    isInitialFetchAfterPanelOpen,
    isExtractingFromTabOptions,
  });

  const sourceSummaryAccessLanguages = Array.from(
    new Set([
      ...(sourceSummaryAccessLanguagesFromProperties ?? []),
      ...languages.availableLanguages,
    ])
  );

  const isJobProcessingForSelectedLanguage =
    !!isJobProcessing && job?.language === languages.selectedLanguage;
  const isOptimisticExtractForSelectedLanguage =
    !isCompletedJobForSelectedLanguage &&
    optimisticallyAddedLanguages.has(languages.selectedLanguage) &&
    !isSelectedLanguageInList;
  const isExtracting =
    isExtractingSummary ||
    isExtractingFromTabOptions ||
    isJobProcessingForSelectedLanguage ||
    isOptimisticExtractForSelectedLanguage;

  return {
    summaries,
    availableLanguages: languages.availableLanguages,
    selectedLanguage: languages.selectedLanguage,
    setSelectedLanguage: languages.setSelectedLanguage,
    currentSummary: finalCurrentSummary,
    isLoading,
    error,
    handleExtractSummary,
    isExtracting,
    hasAccessForSelectedLanguage: shouldTreatAsEmpty ? false : isAlreadyExtracted,
    sourceSummaryAccessLanguages,
    readonly,
  };
}
