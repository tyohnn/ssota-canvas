/**
 * Re-export for prefetch compatibility
 *
 * Prefetch system expects: ../block-type/pdf/action-items
 * Actual location: components/action-items
 *
 * This file re-exports the actual component to maintain compatibility
 */
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { ExtractPdfContentAction } from './components/extract-pdf-content-action';
import { SummarizePdfAction } from './components/summarize-pdf-action';

export function PdfActionItems({
  blockId,
  blockData,
}: {
  blockId: string;
  blockData: BlockNodeData;
}) {
  return (
    <>
      <ExtractPdfContentAction blockId={blockId} blockData={blockData} />
      <SummarizePdfAction blockId={blockId} blockData={blockData} />
    </>
  );
}
