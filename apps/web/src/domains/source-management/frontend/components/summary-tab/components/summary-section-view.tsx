/**
 * Summary Section View
 *
 * Presentational 컴포넌트
 * source_summaries 탭에서 공통으로 사용
 */

'use client';

import type { SummarySectionViewProps } from '../core/types';

import { LanguageSelector } from './language-selector';
import { SummaryContent } from './summary-content';
import {
  SummaryErrorState,
  SummaryLoadingState,
  SummaryNoSummaryState,
} from './states';
import { SummarySectionContainer } from './summary-section-container';

export function SummarySectionView({
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
  userPreferredLanguage,
}: SummarySectionViewProps) {
  const languageSelectorProps = {
    availableLanguages: sourceSummaryAccessLanguages || [],
    selectedLanguage,
    onChange: setSelectedLanguage,
    userPreferredLanguage,
  };
  if (isExtracting) {
    return (
      <SummarySectionContainer>
        <LanguageSelector {...languageSelectorProps} />
        <SummaryLoadingState isExtracting={isExtracting} />
      </SummarySectionContainer>
    );
  }

  if (isLoading && currentSummary === undefined) {
    return (
      <SummarySectionContainer>
        <LanguageSelector {...languageSelectorProps} />
        <SummaryLoadingState isExtracting={false} />
      </SummarySectionContainer>
    );
  }

  if (error && !error.includes('Summary not extracted')) {
    return (
      <SummarySectionContainer>
        <LanguageSelector {...languageSelectorProps} />
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
      <LanguageSelector {...languageSelectorProps} />

      {currentSummary ? (
        <SummaryContent
          summary={currentSummary.summary}
          keywords={currentSummary.keywords}
        />
      ) : (
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
