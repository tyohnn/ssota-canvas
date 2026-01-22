/**
 * Summary Section Business Logic Hook
 *
 * YouTube 요약 로드 및 관리 로직
 *
 * ✅ TanStack Query 사용:
 * - 컴포넌트가 렌더링될 때만 요약 로드 (enabled 옵션)
 * - 자동 캐싱: 같은 blockId/youtubeId로 여러 번 호출해도 한 번만 요청
 * - staleTime: 24시간 (요약은 한번 추출되면 거의 변경되지 않음)
 */

'use client';

import { useState, useMemo, useEffect } from 'react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import {
  useAvailableSummaryLanguages,
  useExtractVideoSummary,
  useProcessVideoSummary,
} from '@/domains/youtube-app-space/frontend/hooks';

import type { SummarySectionBusinessLogic } from './types';

/**
 * 에디터 패널이 마운트된 동안 blockId별 언어 선택 상태를 유지하는 Map
 * 탭 전환 시에도 상태가 유지됨
 */
const languageStateMap = new Map<string, string>();

/**
 * Summary Section Business Logic Hook
 *
 * YouTube 블록의 요약을 로드하고 관리하는 비즈니스 로직
 */
export function useSummarySectionBusiness(
  blockId: string,
  blockData: BlockNodeData | undefined
): SummarySectionBusinessLogic {
  // Optimistic update를 위한 로컬 state: 새로 추가된 언어를 추적
  // TanStack Query mutation의 onMutate/onError 콜백에서 관리
  const [optimisticallyAddedLanguages, setOptimisticallyAddedLanguages] = useState<Set<string>>(new Set());

  // Readonly 모드 확인 및 publish token 가져오기 (퍼블릭 페이지 등)
  const { readonly, publishToken } = useCanvasReadOnly();

  // Block properties에서 YouTube 정보 추출
  const properties = blockData?.properties as
    | YoutubeBlockProperties
    | undefined;

  // YoutubeBlockPropertiesVO로 변환하여 타입 안전하게 youtubeId와 youtubeTitle 추출
  let youtubeId: string | undefined;
  let youtubeTitle: string | undefined;
  let summaryAccessGrantedLanguages: string[] | undefined;
  try {
    if (properties) {
      const youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(properties);
      youtubeId = youtubeProperties.youtubeId;
      youtubeTitle = youtubeProperties.youtubeTitle;
      summaryAccessGrantedLanguages =
        youtubeProperties.summaryAccessGrantedLanguages;
    }
  } catch (error) {
    console.warn('[SummarySection] Failed to parse YouTube properties:', error);
  }

  // 언어 목록 조회 (먼저 수행)
  const {
    languages: availableSummaryLanguages,
    isLoading: isLoadingLanguages,
    error: languagesError,
  } = useAvailableSummaryLanguages({
    blockId,
    youtubeId: youtubeId || '',
    readonly,
    publishToken: readonly ? publishToken : undefined,
  });

  // 언어 선택 상태 초기화
  // 1. 이전에 저장된 언어 확인 (탭 전환 시 유지)
  // 2. 없으면 available한 언어의 첫 번째
  // 3. 그것도 없으면 'en' (기본값)
  const initialLanguage = useMemo(() => {
    const stored = languageStateMap.get(blockId);
    if (stored) {
      return stored;
    }
    // available한 언어가 있으면 첫 번째 사용
    if (availableSummaryLanguages.length > 0 && availableSummaryLanguages[0]) {
      return availableSummaryLanguages[0];
    }
    return 'en'; // 기본값
  }, [blockId, availableSummaryLanguages]);

  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage);

  // available한 언어 목록이 로드되면, 저장된 언어가 없을 경우 첫 번째 언어로 설정
  useEffect(() => {
    if (isLoadingLanguages) {
      return;
    }

    const stored = languageStateMap.get(blockId);
    if (!stored) {
      // 저장된 언어가 없으면 available한 언어의 첫 번째로 설정 (없으면 현재 선택 유지)
      if (availableSummaryLanguages.length > 0) {
        const firstAvailable = availableSummaryLanguages[0];
        if (firstAvailable && firstAvailable !== selectedLanguage) {
          setSelectedLanguage(firstAvailable);
          languageStateMap.set(blockId, firstAvailable);
        }
      }
    } else if (stored !== selectedLanguage) {
      // 저장된 언어가 있으면 복원 (available하지 않아도 유지 - Extract 버튼 표시를 위해)
      setSelectedLanguage(stored);
    }
  }, [blockId, availableSummaryLanguages, isLoadingLanguages, selectedLanguage]);

  // 언어 변경 시 상태 Map에 저장 (탭 전환 시 유지)
  const handleSetSelectedLanguage = (language: string) => {
    setSelectedLanguage(language);
    languageStateMap.set(blockId, language);
  };

  // 선택된 언어가 이미 추출되었는지 확인
  // availableSummaryLanguages는 이미 추출된 언어 목록 (summaryAccessGrantedLanguages 또는 action_transactions 기록)
  // 이 목록에 없는 언어는 아직 추출되지 않았으므로 API 호출 없이 바로 "요약 없음" 상태로 처리
  const isAlreadyExtracted = availableSummaryLanguages.includes(selectedLanguage);

  // 선택된 언어의 요약 처리 (언어가 바뀔 때 수행)
  // 이미 추출된 언어만 processVideoSummary 호출 (불필요한 API 호출 방지)
  const enabledProcessSummary = !!blockId && !!youtubeId && !!selectedLanguage && isAlreadyExtracted;
  const {
    summary: currentSummary,
    isLoading: isProcessingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useProcessVideoSummary({
    blockId,
    youtubeId: youtubeId || '',
    language: selectedLanguage,
    readonly,
    publishToken: readonly ? publishToken : undefined,
    enabled: enabledProcessSummary,
  });

  // 언어 변경 시 캐시된 데이터를 활용하여 빠른 전환을 지원
  // 모든 언어의 요약을 미리 로드하지는 않지만, placeholderData로 이전 데이터를 유지

  // 요약 추출 훅 (readonly 모드가 아닐 때만 사용)
  // TanStack Query Mutation을 사용하여 optimistic update 지원
  const {
    extractSummary,
    isExtracting: isExtractingSummary,
  } = useExtractVideoSummary({
    blockId,
    youtubeId: youtubeId || '',
    readonly,
    publishToken: readonly ? publishToken : undefined,
    // TanStack Query mutation의 optimistic update 콜백 활용
    onMutate: (language) => {
      // Optimistic update: 로컬 state에 언어 추가 (서버 요청 없이 UI 즉시 업데이트)
      setOptimisticallyAddedLanguages((prev) => {
        const next = new Set(prev);
        next.add(language);
        return next;
      });
    },
    onMutateError: (error, language) => {
      // 실패 시 optimistic update 롤백
      setOptimisticallyAddedLanguages((prev) => {
        const next = new Set(prev);
        next.delete(language);
        return next;
      });
    },
    onSuccess: () => {
      // 요약 데이터는 refetch하여 최신 내용 표시
      refetchSummary();
    },
    onError: (error) => {
      console.error('[SummarySection] Failed to extract summary:', error);
    },
  });

  // 사용 가능한 언어 목록 (API에서 받은 언어 목록 사용)
  const availableLanguages = availableSummaryLanguages;

  // summaries 배열은 currentSummary 하나만 포함 (UI 호환성)
  const summaries = currentSummary ? [currentSummary] : [];

  // currentSummary 결정 로직
  // - 아직 추출되지 않은 언어 → null (요약 없음, API 호출 안 함, Extract 버튼 표시)
  // - 이미 추출된 언어 → processVideoSummary 호출 → currentSummary (캐시됨)
  //   * currentSummary가 VideoSummaryView → summary 있음
  //   * currentSummary가 null → summary 없음 (캐시됨) - 이론상 발생하지 않음
  //   * currentSummary가 undefined → 아직 로드 안 함 (loading 상태)
  const finalCurrentSummary = isAlreadyExtracted ? currentSummary : null;

  // 에러 처리 (언어 조회 에러 우선)
  // 아직 추출되지 않은 언어는 에러가 아니므로 summaryError 무시
  const error = languagesError || (isAlreadyExtracted ? summaryError : null);

  // 요약 추출 핸들러
  const handleExtractSummary = async (language: string): Promise<void> => {
    if (readonly) {
      console.warn('[SummarySection] Cannot extract summary in readonly mode');
      return;
    }

    if (!youtubeId || !blockId) {
      console.warn('[SummarySection] YouTube ID or Block ID not found');
      return;
    }

    // mutation 실행 (optimistic update는 useExtractVideoSummary의 onMutate에서 처리)
    extractSummary(language);
  };

  // 언어 변경 시 optimistic하게 동작하도록 로딩 상태 최적화
  // - 아직 추출되지 않은 언어 → 로딩 없음 (바로 NoSummary + Extract 버튼 표시)
  // - 이미 추출된 언어이고 currentSummary가 undefined면 → 아직 로드 안 함 (loading 표시)
  // - 이미 추출된 언어이고 currentSummary가 VideoSummaryView면 → 요약 있음 (캐시됨, 즉시 표시)
  const isLoading = isLoadingLanguages || (isAlreadyExtracted && isProcessingSummary && currentSummary === undefined && !isExtractingSummary);

  // summaryAccessGrantedLanguages, availableSummaryLanguages, optimistic state를 병합하여 LanguageSelector에 전달
  // 서버 요청 없이 즉시 UI 업데이트 가능
  // availableSummaryLanguages는 API에서 가져온 실제 available한 언어 목록 (URL 입력 시 summaryAccessGrantedLanguages가 비어있을 수 있음)
  const mergedSummaryAccessGrantedLanguages = useMemo(() => {
    const base = summaryAccessGrantedLanguages || [];
    const merged = new Set([
      ...base,
      ...availableSummaryLanguages, // API에서 가져온 available한 언어 목록 포함
      ...optimisticallyAddedLanguages, // Optimistic update로 추가된 언어
    ]);
    return Array.from(merged);
  }, [summaryAccessGrantedLanguages, availableSummaryLanguages, optimisticallyAddedLanguages]);

  return {
    youtubeId,
    youtubeTitle,
    summaries,
    availableLanguages,
    selectedLanguage,
    setSelectedLanguage: handleSetSelectedLanguage, // localStorage에 저장하는 래퍼 함수
    currentSummary: finalCurrentSummary, // 아직 추출되지 않은 언어는 null로 처리
    isLoading,
    error,
    handleExtractSummary,
    isExtracting: isExtractingSummary, // 요약 추출 중 상태
    hasAccessForSelectedLanguage: isAlreadyExtracted, // 이미 추출된 언어인지 여부
    summaryAccessGrantedLanguages: mergedSummaryAccessGrantedLanguages, // 병합된 언어 목록 (체크 표시용)
    readonly, // Readonly 모드 플래그
  };
}
