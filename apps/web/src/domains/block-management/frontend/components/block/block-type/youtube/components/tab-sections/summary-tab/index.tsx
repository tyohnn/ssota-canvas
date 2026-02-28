/**
 * Summary tab
 *
 * Editor Panel의 Summary 탭 컴포넌트
 * YouTube 블록의 요약을 표시하고 편집
 */

'use client';

import {
  SummarySectionView,
  type SummarySectionViewProps,
} from '@/domains/source-management/frontend/components/summary-tab';
import { useSourceSummarySection } from '@/domains/source-management/frontend/components/summary-tab';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface SummaryTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function SummaryTab({
  blockId,
  blockData,
}: SummaryTabProps) {
  let sourceSummaryAccessLanguagesFromProperties: string[] | undefined;
  try {
    const props = blockData?.properties as YoutubeBlockProperties | undefined;
    if (props) {
      sourceSummaryAccessLanguagesFromProperties =
        YoutubeBlockPropertiesVO.fromJSON(props).sourceSummaryAccessLanguages;
    }
  } catch {
    // ignore
  }

  const business = useSourceSummarySection({
    blockSlug: blockId,
    sourceId: blockData?.sourceId,
    sourceSummaryAccessLanguagesFromProperties,
  });

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
