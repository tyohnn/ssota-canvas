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

import { useEffect, useState } from 'react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import {
  useCheckVideoSummaryTransaction,
  useExtractVideoSummary,
  useVideoSummaries,
} from '@/domains/youtube-app-space/frontend/hooks';

import type { SummarySectionBusinessLogic } from './types';

/**
 * Summary Section Business Logic Hook
 *
 * YouTube 블록의 요약을 로드하고 관리하는 비즈니스 로직
 */
export function useSummarySectionBusiness(
  blockId: string,
  blockData: BlockNodeData | undefined
): SummarySectionBusinessLogic {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en'); // 기본 언어

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

  // Action Transaction 확인 (추출 액션이 실행된 적이 있는지)
  // ⚠️ summaryAccessGrantedLanguages에 언어가 있으면 건너뛰기 (Action Transaction 확인 불필요)
  const hasAnyLanguageAccess =
    summaryAccessGrantedLanguages && summaryAccessGrantedLanguages.length > 0;

  const { exists: hasActionTransaction, isLoading: isCheckingTransaction } =
    useCheckVideoSummaryTransaction({
      blockId,
      enabled: !!blockId && !hasAnyLanguageAccess,
    });

  const hasExtractAction = hasAnyLanguageAccess || hasActionTransaction;

  // 모든 언어의 요약 로드
  const {
    summaries,
    isLoading: isLoadingSummaries,
    error: summariesError,
  } = useVideoSummaries({
    blockId,
    youtubeId: youtubeId || '',
    summaryAccessGrantedLanguages,
    enabled:
      !!blockId &&
      !!youtubeId &&
      (hasAnyLanguageAccess ||
        (hasExtractAction && !isCheckingTransaction)),
  });

  // 요약 추출 훅
  const { extractSummary, isExtracting } = useExtractVideoSummary({
    blockId,
    youtubeId: youtubeId || '',
    onSuccess: (data) => {
      // 추출된 언어로 자동 전환
      if (data?.summary) {
        setSelectedLanguage(data.summary.language);
      }
    },
  });

  // 선택된 언어의 요약 찾기
  const currentSummary = summaries.find(s => s.language === selectedLanguage);

  // 초기 로딩 시: 요약이 있고 선택된 언어에 요약이 없으면 첫 번째 요약의 언어로 자동 설정
  // (사용자가 명시적으로 언어를 선택한 후에는 자동 전환하지 않음)
  useEffect(() => {
    // 초기 상태에서만 자동 설정 (summaries가 처음 로드될 때)
    if (summaries.length > 0 && !currentSummary && selectedLanguage === 'en') {
      const firstSummary = summaries[0];
      if (firstSummary) {
        setSelectedLanguage(firstSummary.language);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaries.length]); // summaries.length만 의존성으로 사용하여 초기 로딩 시에만 실행

  // 에러 처리
  const error = summariesError
    ? summariesError.message
    : null;

  // 요약 추출 핸들러 (언어별)
  const handleExtractSummary = async (language: string) => {
    await extractSummary(language);
  };

  return {
    youtubeId,
    youtubeTitle,
    summaries,
    selectedLanguage,
    setSelectedLanguage,
    currentSummary,
    isLoading: isLoadingSummaries || isCheckingTransaction,
    error,
    handleExtractSummary,
    hasExtractAction,
    isExtracting,
  };
}
