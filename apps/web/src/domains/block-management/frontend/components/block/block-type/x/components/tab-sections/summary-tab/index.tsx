'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { XBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { SourceSummaryTab } from '@/domains/block-management/frontend/components/block/block-type/shared/source-summary-tab';

function getSourceSummaryAccessLanguagesFromXProperties(
  properties: unknown
): string[] | undefined {
  return (properties as XBlockProperties | undefined)?.sourceSummaryAccessLanguages;
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
      emptyMessage="Enter an X post URL and load metadata first."
      getSourceSummaryAccessLanguagesFromProperties={
        getSourceSummaryAccessLanguagesFromXProperties
      }
    />
  );
}
