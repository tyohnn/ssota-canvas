'use client';

import type { SummarySectionViewProps } from '../types';
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
  orderedLanguages = sourceSummaryAccessLanguages ?? availableLanguages,
  getLanguageName = (c) => c.toUpperCase(),
  summaryContentDeps,
}: SummarySectionViewProps) {
  const languageSelectorProps = {
    availableLanguages: sourceSummaryAccessLanguages ?? [],
    selectedLanguage,
    onChange: setSelectedLanguage,
    userPreferredLanguage,
    orderedLanguages,
    getLanguageName,
  };

  if (isExtracting) {
    return (
      <SummarySectionContainer>
        <LanguageSelector {...languageSelectorProps} />
        <SummaryLoadingState isExtracting={true} />
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
          getLanguageName={getLanguageName}
        />
      </SummarySectionContainer>
    );
  }

  return (
    <SummarySectionContainer>
      <LanguageSelector {...languageSelectorProps} />
      {currentSummary && summaryContentDeps ? (
        <SummaryContent
          summary={currentSummary.summary}
          keywords={currentSummary.keywords}
          deps={summaryContentDeps}
        />
      ) : (
        <SummaryNoSummaryState
          language={selectedLanguage}
          onExtractSummary={onExtractSummary}
          isExtracting={isExtracting}
          readonly={readonly}
          getLanguageName={getLanguageName}
        />
      )}
    </SummarySectionContainer>
  );
}
