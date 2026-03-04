'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { PdfBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { SourceSummaryTab } from '@/domains/block-management/frontend/components/block/block-type/shared/source-summary-tab';

const getSourceSummaryAccessLanguagesFromPdfProperties = (
  properties: unknown
): string[] | undefined =>
  (properties as PdfBlockProperties | undefined)?.sourceSummaryAccessLanguages;

export interface SummaryTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function SummaryTab({ blockId, blockData }: SummaryTabProps) {
  return (
    <SourceSummaryTab
      blockId={blockId}
      blockData={blockData}
      emptyMessage="Add a PDF file or URL to enable summarization."
      getSourceSummaryAccessLanguagesFromProperties={
        getSourceSummaryAccessLanguagesFromPdfProperties
      }
    />
  );
}
