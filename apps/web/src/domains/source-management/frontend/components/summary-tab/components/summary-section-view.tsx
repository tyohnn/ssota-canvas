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
}: SummarySectionViewProps) {
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

  if (error && !error.includes('Summary not extracted')) {
    return (
      <SummarySectionContainer>
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
      <LanguageSelector
        availableLanguages={sourceSummaryAccessLanguages || []}
        selectedLanguage={selectedLanguage}
        onChange={setSelectedLanguage}
      />

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
