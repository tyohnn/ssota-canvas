'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { SourceSummaryTab } from '@/domains/block-management/frontend/components/block/block-type/shared/source-summary-tab';

function getSourceSummaryAccessLanguagesFromYoutubeProperties(
  properties: unknown
): string[] | undefined {
  try {
    const props = properties as YoutubeBlockProperties | undefined;
    if (props) {
      return YoutubeBlockPropertiesVO.fromJSON(props).sourceSummaryAccessLanguages;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export interface SummaryTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function SummaryTab({ blockId, blockData }: SummaryTabProps) {
  return (
    <SourceSummaryTab
      blockId={blockId}
      blockData={blockData}
      emptyMessage="Enter a YouTube URL and load metadata first."
      getSourceSummaryAccessLanguagesFromProperties={
        getSourceSummaryAccessLanguagesFromYoutubeProperties
      }
    />
  );
}
