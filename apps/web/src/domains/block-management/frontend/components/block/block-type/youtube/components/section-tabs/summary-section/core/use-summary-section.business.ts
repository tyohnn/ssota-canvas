/**
 * Summary Section Business Logic Hook
 *
 * YouTube 요약 로드 및 관리 로직 (source-management만 사용)
 *
 * ✅ sourceId 있을 때만 요약 로드/추출. 없으면 안내 메시지.
 *
 * ## 데이터 흐름
 * 1. blockData에서 sourceId, properties(sourceSummaryAccessLanguages 등) 추출
 * 2. useSourceSummaryLanguages: API로 사용 가능한 요약 언어 목록 조회
 * 3. useSourceSummary: 선택된 언어의 요약 본문 조회
 * 4. processSourceSummaryAction: 새 언어로 요약 추출 요청 (큐 잡 생성)
 */

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
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
import type { VideoSummaryView } from '@/domains/youtube-app-space/shared/dtos/views/video-summary.views';

import type { SummarySectionBusinessLogic } from './types';

/** source-management DTO를 Summary Section View 형식으로 변환 */
function sourceSummaryToVideoView(
  dto: { summary: string; keywords: string[]; language: string; updatedAt: Date; sourceId: string }
): VideoSummaryView {
  const updatedAt = dto.updatedAt instanceof Date ? dto.updatedAt.toISOString() : String(dto.updatedAt);
  return {
    id: `${dto.sourceId}-${dto.language}`,
    videoId: dto.sourceId,
    language: dto.language,
    summary: dto.summary,
    keywords: dto.keywords ?? [],
    createdAt: updatedAt,
    updatedAt,
  };
}

/**
 * 블록별로 마지막 선택한 언어를 기억 (탭 전환 후 재진입 시 유지)
 * key: blockId, value: language code (e.g. 'en', 'ko')
 */
const languageStateMap = new Map<string, string>();

/**
 * Summary Section Business Logic Hook
 *
 * sourceId가 있을 때만 useSourceSummaryLanguages + useSourceSummary + processSourceSummaryAction 사용.
 */
export function useSummarySectionBusiness(
  blockId: string,
  blockData: BlockNodeData | undefined
): SummarySectionBusinessLogic {
  const [optimisticallyAddedLanguages, setOptimisticallyAddedLanguages] = useState<Set<string>>(new Set());
  const canvasMode = useCanvasModeContext();
  const { workspaceId } = useCanvasMetadata();
  const { setAutoSummaryBlockId } = useAIActionContext();
  const { readonly, publishToken } = useCanvasReadOnly();

  // -------------------------------------------------------------------------
  // 1. blockData에서 YouTube properties 추출
  // -------------------------------------------------------------------------
  const properties = blockData?.properties as
    | YoutubeBlockProperties
    | undefined;

  let youtubeId: string | undefined;
  let youtubeTitle: string | undefined;
  let sourceSummaryAccessLanguages: string[] | undefined;
  try {
    if (properties) {
      const youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(properties);
      youtubeId = youtubeProperties.youtubeId;
      youtubeTitle = youtubeProperties.youtubeTitle;
      sourceSummaryAccessLanguages =
        youtubeProperties.sourceSummaryAccessLanguages;
    }
  } catch (error) {
    console.warn('[SummarySection] Failed to parse YouTube properties:', error);
  }

  const sourceId = blockData?.sourceId;

  // -------------------------------------------------------------------------
  // 2. 에디터 재오픈 시 진행 중 job 조회 → useSourceJobRealtime initialJob
  // -------------------------------------------------------------------------
  const {
    data: inProgressJobData,
    isFetching: isFetchingInProgressJob,
  } = useQuery({
    queryKey: ['source-job-in-progress', blockId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const result = await getInProgressSourceJobByBlockIdAction({ workspaceId, blockId: blockId ?? '' });
      return result.success ? result.data : null;
    },
    enabled: !!workspaceId && !!blockId && !!sourceId && !readonly,
    staleTime: 5000,
  });
  const initialJob: SourceJob | null =
    inProgressJobData?.job != null
      ? (inProgressJobData.job as SourceJob)
      : null;

  // -------------------------------------------------------------------------
  // 3. Realtime: source job 완료 시 캐시 무효화, 진행 중이면 extracting 유지
  // -------------------------------------------------------------------------
  const { isCompleted, isProcessing: isJobProcessing, job } = useSourceJobRealtime(blockId ?? '', initialJob);
  const queryClient = useQueryClient();
  const prevCompletedRef = useRef(false);

  useEffect(() => {
    if (!blockId || !sourceId) return;
    if (isCompleted && !prevCompletedRef.current) {
      prevCompletedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['source-summary', blockId] });
      queryClient.invalidateQueries({
        queryKey: ['source-summary-languages', blockId],
      });
      queryClient.invalidateQueries({
        queryKey: ['source-job-in-progress', blockId],
      });
    }
    if (!isCompleted) prevCompletedRef.current = false;
  }, [blockId, sourceId, isCompleted, queryClient]);

  // -------------------------------------------------------------------------
  // 4. 사용 가능한 요약 언어 목록 조회 (API: source_summaries)
  // -------------------------------------------------------------------------
  const sourceLanguages = useSourceSummaryLanguages({
    blockId,
    ...(readonly && publishToken && sourceId
      ? { sourceId, publishToken, readonly: true as const }
      : {}),
    enabled: !!blockId && !!sourceId,
  });

  const availableSummaryLanguages = sourceId ? sourceLanguages.languages : [];
  const isLoadingLanguages = !!sourceId && sourceLanguages.isLoading;
  const languagesError = sourceId ? sourceLanguages.error : null;

  // 패널을 닫은 채로 요약이 완료된 뒤 다시 열면 캐시가 갱신되지 않아 empty가 나옴 → 마운트 시 언어 목록 갱신
  useEffect(() => {
    if (!blockId || !sourceId || readonly) return;
    queryClient.invalidateQueries({ queryKey: ['source-summary-languages', blockId] });
  }, [blockId, sourceId, readonly, queryClient]);

  // job 완료 후 availableSummaryLanguages에 언어가 도착하면 낙관적 상태 정리
  useEffect(() => {
    if (!isCompleted) return;
    setOptimisticallyAddedLanguages((prev) => {
      const next = new Set(prev);
      availableSummaryLanguages.forEach((lang) => next.delete(lang));
      return next.size === prev.size ? prev : next;
    });
  }, [isCompleted, availableSummaryLanguages]);

  // -------------------------------------------------------------------------
  // 5. 선택된 언어 상태: 초기값 + languageStateMap으로 탭 전환 시 유지
  // -------------------------------------------------------------------------
  const initialLanguage = useMemo(() => {
    const stored = languageStateMap.get(blockId);
    if (stored) return stored;
    if (availableSummaryLanguages.length > 0 && availableSummaryLanguages[0]) {
      return availableSummaryLanguages[0];
    }
    return 'en';
  }, [blockId, availableSummaryLanguages]);

  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage);

  useEffect(() => {
    if (isLoadingLanguages) return;
    const stored = languageStateMap.get(blockId);
    if (!stored) {
      if (availableSummaryLanguages.length > 0) {
        const firstAvailable = availableSummaryLanguages[0];
        if (firstAvailable && firstAvailable !== selectedLanguage) {
          setSelectedLanguage(firstAvailable);
          languageStateMap.set(blockId, firstAvailable);
        }
      }
    } else if (stored !== selectedLanguage) {
      setSelectedLanguage(stored);
    }
  }, [blockId, availableSummaryLanguages, isLoadingLanguages, selectedLanguage]);

  // -------------------------------------------------------------------------
  // 5b. 진행 중 job이 있으면 해당 언어로 선택 동기화 (새로고침 후 패널 열 때 영어가 아닌 실제 job 언어 표시)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const jobLanguage = job?.language ?? initialJob?.language;
    if (!blockId || !jobLanguage) return;
    if (isJobProcessing) {
      languageStateMap.set(blockId, jobLanguage);
      setSelectedLanguage(jobLanguage);
    }
  }, [blockId, isJobProcessing, job?.language, initialJob?.language]);

  // -------------------------------------------------------------------------
  // 6. initialTab 옵션: Action Items 등에서 "이 언어로 요약 추출" 클릭 시
  //    Summary 탭으로 전환 + 선택 언어 지정
  // -------------------------------------------------------------------------
  const isEditingThisBlock =
    canvasMode.mode.type === 'block-editing' && canvasMode.mode.blockId === blockId;
  const isSummaryTabWithOptions =
    canvasMode.mode.type === 'block-editing' &&
    canvasMode.mode.initialTab?.tab === 'summary' &&
    !!canvasMode.mode.initialTab.tabOptions;

  useEffect(() => {
    if (
      canvasMode.mode.type === 'block-editing' &&
      canvasMode.mode.blockId === blockId &&
      canvasMode.mode.initialTab?.tab === 'summary' &&
      canvasMode.mode.initialTab.tabOptions?.language
    ) {
      const language = canvasMode.mode.initialTab.tabOptions.language as string;
      languageStateMap.set(blockId, language);
      setSelectedLanguage(language);
    }
  }, [canvasMode.mode, blockId]);

  // Extract 버튼 클릭 후 Summary 탭 진입 시 "추출 중" UI 표시용
  const isExtractingFromTabOptions =
    isEditingThisBlock &&
    isSummaryTabWithOptions &&
    canvasMode.mode.type === 'block-editing' &&
    canvasMode.mode.initialTab?.tabOptions?.isExtracting === true;

  const handleSetSelectedLanguage = (language: string) => {
    setSelectedLanguage(language);
    languageStateMap.set(blockId, language);
  };

  // -------------------------------------------------------------------------
  // 7. 선택된 언어의 요약 본문 조회 (API: source_summaries)
  //    isAlreadyExtracted: 선택 언어가 이미 추출됐으면 본문 fetch, 아니면 Extract UI
  //    낙관적 fetch는 목록에 없을 때 (1) Extract 직후 (2) 방금 완료된 job이 이 언어일 때만 → 불필요한 호출/not-found 방지
  // -------------------------------------------------------------------------
  const isSelectedLanguageInList = availableSummaryLanguages.includes(selectedLanguage);
  const isCompletedAndOptimisticallyAdded =
    isCompleted && optimisticallyAddedLanguages.has(selectedLanguage);
  const isCompletedJobForSelectedLanguage =
    isCompleted && job?.language === selectedLanguage;

  const isAlreadyExtracted =
    isSelectedLanguageInList ||
    isCompletedAndOptimisticallyAdded ||
    isCompletedJobForSelectedLanguage;
  const enabledProcessSummary = !!blockId && !!selectedLanguage && isAlreadyExtracted && !!sourceId;

  const sourceSummary = useSourceSummary({
    blockId,
    language: selectedLanguage,
    ...(readonly && publishToken && sourceId
      ? { sourceId, publishToken, readonly: true as const }
      : {}),
    enabled: enabledProcessSummary,
  });

  const currentSummary: VideoSummaryView | undefined =
    sourceId && sourceSummary.summary
      ? sourceSummaryToVideoView(sourceSummary.summary)
      : undefined;
  const isProcessingSummary = !!sourceId && sourceSummary.isLoading;
  const summaryError = sourceId ? sourceSummary.error : null;
  const refetchSummary = sourceId ? sourceSummary.refetch : () => Promise.resolve();

  // B: 완료 직후 summary row 커밋 레이스로 "not found"가 나온 경우만 에러 대신 empty 표시
  const summaryErrorText =
    summaryError == null
      ? ''
      : typeof summaryError === 'string'
        ? summaryError
        : summaryError.message ?? '';
  const isSummaryNotFoundError = summaryErrorText.includes('Source summary not found');
  const isSelectedLanguageNotInList = !availableSummaryLanguages.includes(selectedLanguage);
  const shouldTreatAsEmpty = isSummaryNotFoundError && isSelectedLanguageNotInList;

  // -------------------------------------------------------------------------
  // 8. 추가 언어 요약 추출 Mutation (processSourceSummaryAction → 큐 잡 생성)
  //    optimisticallyAddedLanguages: Extract 클릭 직후 UI에 언어 추가 (낙관적 업데이트)
  // -------------------------------------------------------------------------
  const processSourceMutation = useMutation({
    mutationFn: async (language: string) => {
      if (!workspaceId) throw new Error('Workspace not found');
      const result = await processSourceSummaryAction({ workspaceId, blockId, language });
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
        queryKey: ['source-summary', blockId],
      });
      queryClient.invalidateQueries({
        queryKey: ['source-summary-languages', blockId],
      });
    },
  });

  const isExtractingSummary = processSourceMutation.isPending;

  // -------------------------------------------------------------------------
  // 9. View에 전달할 최종 값 계산
  //    finalCurrentSummary: 추출된 언어만 본문 표시, 미추출 언어는 null → NoSummaryState
  //    언어 목록 로딩 중(availableSummaryLanguages 빈 배열)이면 undefined → LoadingState
  // -------------------------------------------------------------------------
  const availableLanguages = availableSummaryLanguages;
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

  // 언어 목록 에러 | (추출된 언어인 경우) 본문 에러 | sourceId 없으면 안내 메시지
  // B: not found 레이스 시 에러 노출 안 함 → empty 표시
  const rawError = shouldTreatAsEmpty
    ? languagesError ?? null
    : languagesError || (isAlreadyExtracted ? summaryError : null);
  const hasBlockButNoSource = !sourceId && !!blockId;
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
    if (!blockId) return;
    if (!sourceId) return;
    setAutoSummaryBlockId(blockId);
    processSourceMutation.mutate(language);
  };

  // 언어 목록 로딩 중 | (추출됐고 본문 로딩 중이고 아직 없음) | Extract 버튼 직후
  // job 완료 직후: isAlreadyExtracted인데 summary 아직 없으면 → loading (empty 플래시 방지)
  // 패널 재오픈 시: 진행 중 job 조회 중이면 로딩 표시 → empty 플래시 방지
  // shouldTreatAsEmpty(not found 레이스)면 로딩 비표시
  const isSummaryContentLoading =
    !shouldTreatAsEmpty &&
    isAlreadyExtracted &&
    currentSummary === undefined &&
    (isProcessingSummary || (isCompleted && optimisticallyAddedLanguages.size > 0)) &&
    !isExtractingSummary;
  const isPanelReopenFetchingJob =
    !!blockId && !!sourceId && !readonly && isFetchingInProgressJob;
  const isLoading =
    isLoadingLanguages ||
    isPanelReopenFetchingJob ||
    isSummaryContentLoading ||
    isExtractingFromTabOptions;

  // block.properties + API 결과만 사용 (체크 표시는 realtime 완료 후에만)
  // optimisticallyAddedLanguages 제외 → Extract 클릭 시 즉시 체크 X, 완료 시점에만 체크
  const mergedSourceSummaryAccessLanguages = useMemo(() => {
    const base = sourceSummaryAccessLanguages || [];
    const merged = new Set([...base, ...availableSummaryLanguages]);
    return Array.from(merged);
  }, [sourceSummaryAccessLanguages, availableSummaryLanguages]);

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
    youtubeId,
    youtubeTitle,
    summaries,
    availableLanguages,
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
