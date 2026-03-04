'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { SourceSummaryTab } from '@/domains/block-management/frontend/components/block/block-type/shared/source-summary-tab';

const getSourceSummaryAccessLanguagesFromLinkProperties = (
  properties: unknown
): string[] | undefined =>
  (properties as LinkBlockProperties | undefined)?.sourceSummaryAccessLanguages;

export interface SummaryTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function SummaryTab({ blockId, blockData }: SummaryTabProps) {
  return (
    <SourceSummaryTab
      blockId={blockId}
      blockData={blockData}
      emptyMessage="Enter a URL and load metadata first."
      getSourceSummaryAccessLanguagesFromProperties={
        getSourceSummaryAccessLanguagesFromLinkProperties
      }
    />
  );
}
