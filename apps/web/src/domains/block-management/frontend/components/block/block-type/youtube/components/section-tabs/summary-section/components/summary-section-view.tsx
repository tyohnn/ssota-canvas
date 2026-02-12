/**
 * Summary Section View
 *
 * Presentational 컴포넌트
 * Props만 받아서 UI를 렌더링합니다.
 */

'use client';

import type { VideoSummaryView } from '@/domains/youtube-app-space/shared/dtos/views/video-summary.views';

import { LanguageSelector } from './language-selector';
import { SummaryContent } from './summary-content';
import { SummaryErrorState } from './summary-error-state';
import { SummaryLoadingState } from './summary-loading-state';
import { SummaryNoSummaryState } from './summary-no-summary-state';
import { SummarySectionContainer } from './summary-section-container';

/**
 * Summary Section View Props
 */
interface SummarySectionViewProps {
  youtubeId: string | undefined;
  youtubeTitle: string | undefined;
  summaries: VideoSummaryView[]; // 현재 선택된 언어의 요약만 포함 (UI 호환성)
  availableLanguages: string[]; // 이미 추출된 언어 목록
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  currentSummary: VideoSummaryView | null | undefined; // 선택된 언어의 요약 (null: 아직 추출 안 됨)
  isLoading: boolean;
  error: string | null;
  onExtractSummary: (language: string) => Promise<void>;
  isExtracting: boolean;
  hasAccessForSelectedLanguage: boolean; // 선택된 언어가 이미 추출되었는지 여부
  sourceSummaryAccessLanguages: string[] | undefined; // sourceSummaryAccessLanguages 원본 (체크 표시용)
  readonly: boolean; // Readonly 모드 플래그 (퍼블릭 페이지 등)
}

/**
 * Summary Section View Component
 *
 * YouTube 블록의 요약을 표시하는 Presentational 컴포넌트
 */
export function SummarySectionView({
  youtubeId,
  youtubeTitle,
  summaries,
  availableLanguages,
  selectedLanguage,
  setSelectedLanguage,
  currentSummary,
  isLoading,
  error,
  onExtractSummary,
  isExtracting,
  hasAccessForSelectedLanguage,
  sourceSummaryAccessLanguages,
  readonly,
}: SummarySectionViewProps) {
  // 요약 추출 중일 때 로딩 상태 표시 (Extract 버튼 클릭 시)
  if (isExtracting) {
    return (
      <SummarySectionContainer>
        <LanguageSelector
          availableLanguages={sourceSummaryAccessLanguages || []}
          selectedLanguage={selectedLanguage}
          onChange={setSelectedLanguage}
        />
        <SummaryLoadingState isExtracting={isExtracting} />
      </SummarySectionContainer>
    );
  }

  // 언어 변경 또는 초기 로딩 중일 때 로딩 표시
  // currentSummary가 undefined면 → 아직 로드 안 함 (loading 표시)
  // currentSummary가 null이면 → 요약 없음 (캐시됨, 즉시 표시)
  if (isLoading && currentSummary === undefined) {
    return (
      <SummarySectionContainer>
        <LanguageSelector
          availableLanguages={sourceSummaryAccessLanguages || []}
          selectedLanguage={selectedLanguage}
          onChange={setSelectedLanguage}
        />
        <SummaryLoadingState isExtracting={false} />
      </SummarySectionContainer>
    );
  }

  // 실제 에러가 있는 경우만 에러 상태 표시
  // (요약이 없는 경우는 에러가 아님)
  if (error && !error.includes('Summary not extracted')) {
    return (
      <SummarySectionContainer>
        {/* 언어 선택 드롭다운 (에러 상태에서도 표시) */}
        <LanguageSelector
          availableLanguages={sourceSummaryAccessLanguages || []}
          selectedLanguage={selectedLanguage}
          onChange={setSelectedLanguage}
        />
        <SummaryErrorState
          error={error}
          hasSummary={summaries.length > 0}
          language={selectedLanguage}
          onExtractSummary={onExtractSummary}
          isExtracting={isExtracting}
          readonly={readonly}
        />
      </SummarySectionContainer>
    );
  }

  return (
    <SummarySectionContainer>
      {/* 언어 선택 드롭다운 */}
      <LanguageSelector
        availableLanguages={sourceSummaryAccessLanguages || []}
        selectedLanguage={selectedLanguage}
        onChange={setSelectedLanguage}
      />

      {/* 선택된 언어의 요약 표시 또는 Empty State */}
      {/* 
        동작 방식:
        1. 아직 추출되지 않은 언어 (availableLanguages에 없음)
          → API 호출 없이 currentSummary = null로 설정
          → 바로 NoSummaryState 표시 (Extract 버튼)
        
        2. 이미 추출된 언어 (availableLanguages에 있음)
          - currentSummary가 VideoSummaryView면 → 요약 표시
          - currentSummary가 undefined면 → 위에서 이미 loading 처리됨
      */}
      {currentSummary ? (
        <SummaryContent
          summary={currentSummary.summary}
          keywords={currentSummary.keywords}
        />
      ) : (
        // currentSummary가 null = 아직 추출되지 않은 언어
        <SummaryNoSummaryState
          language={selectedLanguage}
          onExtractSummary={onExtractSummary}
          isExtracting={isExtracting}
          readonly={readonly}
        />
      )}
    </SummarySectionContainer>
  );
}
