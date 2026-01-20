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
  summaries: VideoSummaryView[]; // 모든 언어의 요약 목록
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  currentSummary: VideoSummaryView | undefined; // 선택된 언어의 요약
  isLoading: boolean;
  error: string | null;
  onExtractSummary: (language: string) => Promise<void>;
  isExtracting: boolean;
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
  selectedLanguage,
  setSelectedLanguage,
  currentSummary,
  isLoading,
  error,
  onExtractSummary,
  isExtracting,
}: SummarySectionViewProps) {
  const availableLanguages = summaries.map(s => s.language);

  // 로딩 중이거나 추출 중일 때 로딩 상태 표시
  if (isLoading || isExtracting) {
    return (
      <SummarySectionContainer>
        <SummaryLoadingState isExtracting={isExtracting} />
      </SummarySectionContainer>
    );
  }

  if (error) {
    return (
      <SummarySectionContainer>
        <SummaryErrorState
          error={error}
          hasSummary={summaries.length > 0}
          language={selectedLanguage}
          onExtractSummary={onExtractSummary}
          isExtracting={isExtracting}
        />
      </SummarySectionContainer>
    );
  }

  return (
    <SummarySectionContainer>
      {/* 언어 선택 드롭다운 */}
      <LanguageSelector
        availableLanguages={availableLanguages}
        selectedLanguage={selectedLanguage}
        onChange={setSelectedLanguage}
      />

      {/* 선택된 언어의 요약 표시 또는 Extract 버튼 */}
      {currentSummary ? (
        <SummaryContent summary={currentSummary.summary} />
      ) : (
        <SummaryNoSummaryState
          language={selectedLanguage}
          onExtractSummary={onExtractSummary}
          isExtracting={isExtracting}
        />
      )}
    </SummarySectionContainer>
  );
}
