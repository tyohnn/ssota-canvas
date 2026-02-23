'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { PdfBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import {
  SummarySectionView,
  type SummarySectionViewProps,
  useSourceSummarySection,
} from '@/domains/source-management/frontend/components/summary-tab';

import { TabEmptyState } from '../tab-empty-state';

export interface SummaryTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function SummaryTab({ blockId, blockData }: SummaryTabProps) {
  const blockSlug = blockData?.blockId ?? blockId;
  const sourceId = blockData?.sourceId;
  const props = blockData?.properties as PdfBlockProperties | undefined;
  const sourceSummaryAccessLanguagesFromProperties =
    props?.sourceSummaryAccessLanguages;

  const business = useSourceSummarySection({
    blockSlug,
    sourceId,
    sourceSummaryAccessLanguagesFromProperties,
  });

  if (!sourceId) {
    return (
      <TabEmptyState
        message="Add a PDF file or URL to enable summarization."
        actionLabel=""
      />
    );
  }

  const viewProps: SummarySectionViewProps = {
    summaries: business.summaries,
    availableLanguages: business.availableLanguages,
    selectedLanguage: business.selectedLanguage,
    setSelectedLanguage: business.setSelectedLanguage,
    currentSummary: business.currentSummary,
    isLoading: business.isLoading,
    error: business.error,
    onExtractSummary: business.handleExtractSummary,
    isExtracting: business.isExtracting,
    hasAccessForSelectedLanguage: business.hasAccessForSelectedLanguage,
    sourceSummaryAccessLanguages: business.sourceSummaryAccessLanguages,
    readonly: business.readonly,
  };

  return <SummarySectionView {...viewProps} />;
}
