'use client';

import { SummarySectionView } from '@workspace/editor-panel';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useSourceSummarySection } from '@/domains/source-management/frontend/adapters/source-summary';
import {
  getLanguageName,
  orderLanguagesWithPreferenceFirst,
  useSummaryContentDeps,
} from '@/domains/editor-panel/frontend/adapters/summary-content-deps';
import { useSourceSummarySectionCanvasDeps } from '@/domains/block-management/frontend/adapters/source-tab-canvas-deps';
import { TabEmptyState } from '@/domains/block-management/frontend/components/block/block-type/link/components/tab-sections/tab-empty-state';

export interface SourceSummaryTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
  emptyMessage: string;
  getSourceSummaryAccessLanguagesFromProperties: (
    properties: unknown
  ) => string[] | undefined;
}

export function SourceSummaryTab({
  blockId,
  blockData,
  emptyMessage,
  getSourceSummaryAccessLanguagesFromProperties,
}: SourceSummaryTabProps) {
  const blockSlug = blockData?.blockId ?? blockId;
  const sourceId = blockData?.sourceId;
  const sourceSummaryAccessLanguagesFromProperties =
    getSourceSummaryAccessLanguagesFromProperties(blockData?.properties);

  const summaryDeps = useSourceSummarySectionCanvasDeps();
  const business = useSourceSummarySection(
    {
      blockSlug,
      sourceId,
      sourceSummaryAccessLanguagesFromProperties,
    },
    summaryDeps
  );

  const summaryContentDeps = useSummaryContentDeps();
  const orderedLanguages = orderLanguagesWithPreferenceFirst(
    business.userPreferredLanguage
  );

  if (!sourceId) {
    return <TabEmptyState message={emptyMessage} actionLabel="" />;
  }

  return (
    <SummarySectionView
      summaries={business.summaries}
      availableLanguages={business.availableLanguages}
      selectedLanguage={business.selectedLanguage}
      setSelectedLanguage={business.setSelectedLanguage}
      currentSummary={business.currentSummary}
      isLoading={business.isLoading}
      error={business.error}
      onExtractSummary={business.handleExtractSummary}
      isExtracting={business.isExtracting}
      hasAccessForSelectedLanguage={business.hasAccessForSelectedLanguage}
      sourceSummaryAccessLanguages={business.sourceSummaryAccessLanguages}
      readonly={business.readonly}
      userPreferredLanguage={business.userPreferredLanguage}
      orderedLanguages={orderedLanguages}
      getLanguageName={getLanguageName}
      summaryContentDeps={summaryContentDeps}
    />
  );
}
