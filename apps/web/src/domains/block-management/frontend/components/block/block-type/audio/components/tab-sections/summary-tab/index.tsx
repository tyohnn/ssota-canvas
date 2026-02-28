/**
 * Summary tab for audio block editor.
 * Uses useSourceSummarySection (source-management) for shared logic.
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { AudioBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import {
  SummarySectionView,
  type SummarySectionViewProps,
} from '@/domains/source-management/frontend/components/summary-tab';
import { useSourceSummarySection } from '@/domains/source-management/frontend/components/summary-tab';

import { TabEmptyState } from '@/domains/block-management/frontend/components/block/block-type/link/components/tab-sections/tab-empty-state';

export interface SummaryTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function SummaryTab({ blockId, blockData }: SummaryTabProps) {
  const blockSlug = blockData?.blockId ?? blockId;
  const sourceId = blockData?.sourceId;
  const props = blockData?.properties as AudioBlockProperties | undefined;
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
        message="Add audio and load metadata first."
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
