/**
 * Summary tab for link block editor.
 * Uses useSourceSummarySection (source-management) for shared logic.
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import {
  SummarySectionView,
  type SummarySectionViewProps,
} from '@/domains/source-management/frontend/components/summary-tab';
import { useSourceSummarySection } from '@/domains/source-management/frontend/components/summary-tab';

import { TabEmptyState } from '../tab-empty-state';

export interface SummaryTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function SummaryTab({ blockId, blockData }: SummaryTabProps) {
  const blockSlug = blockData?.blockId ?? blockId;
  const sourceId = blockData?.sourceId;
  const props = blockData?.properties as LinkBlockProperties | undefined;
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
        message="Enter a URL and load metadata first."
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
    userPreferredLanguage: business.userPreferredLanguage,
  };

  return <SummarySectionView {...viewProps} />;
}
