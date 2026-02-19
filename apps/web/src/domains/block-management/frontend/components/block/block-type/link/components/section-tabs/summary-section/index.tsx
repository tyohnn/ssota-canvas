/**
 * Summary section for link block editor.
 * Uses Source domain: useSourceSummary, useSourceSummaryLanguages
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { Box } from '@/components/ui/box';
import { SectionEmptyState } from '../section-empty-state';
import { useLinkSummarySectionBusiness } from './core/use-link-summary-section.business';

export interface SummarySectionProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function SummarySection({
  blockId,
  blockData,
}: SummarySectionProps) {
  const {
    summaries,
    availableLanguages,
    selectedLanguage,
    setSelectedLanguage,
    isLoading,
    error,
    handleExtractSummary,
    isExtracting,
    hasSourceId,
    readonly,
  } = useLinkSummarySectionBusiness(blockId, blockData);

  if (!hasSourceId) {
    return (
      <SectionEmptyState
        message="Enter a URL and load metadata first."
        actionLabel=""
      />
    );
  }

  if (error) {
    return (
      <Box className="px-6 py-4 text-sm text-destructive">
        {error}
      </Box>
    );
  }

  if (isLoading && summaries.length === 0) {
    return (
      <Box className="px-6 py-4 text-sm text-muted-foreground">
        Loading...
      </Box>
    );
  }

  if (availableLanguages.length === 0 && !isExtracting) {
    return (
      <SectionEmptyState
        message="No summary yet. Extraction runs automatically when you add a URL."
        actionLabel="Run summary"
        onAction={readonly ? undefined : () => handleExtractSummary(selectedLanguage)}
      />
    );
  }

  return (
    <Box className="px-6 py-4 space-y-4">
      {availableLanguages.length > 1 && (
        <Box className="flex gap-2 flex-wrap">
          {availableLanguages.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1 text-xs rounded-md ${
                selectedLanguage === lang
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {lang === 'ko' ? '한국어' : lang === 'en' ? 'English' : lang === 'ja' ? '日本語' : lang}
            </button>
          ))}
        </Box>
      )}
      {summaries.length > 0 ? (
        <Box
          className="prose prose-sm dark:prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{
            __html: summaries[0]?.summary ?? '',
          }}
        />
      ) : isExtracting ? (
        <Box className="text-sm text-muted-foreground">
          Extracting summary...
        </Box>
      ) : (
        <SectionEmptyState
          message="No summary for this language yet."
          actionLabel="Run summary"
          onAction={readonly ? undefined : () => handleExtractSummary(selectedLanguage)}
        />
      )}
    </Box>
  );
}
