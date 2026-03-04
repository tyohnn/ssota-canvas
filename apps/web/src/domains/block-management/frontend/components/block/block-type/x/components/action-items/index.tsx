import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { ExtractSummaryAction } from '@/domains/source-management/frontend/components/extract-summary-action';

export function XActionItems({
  blockId,
  blockData,
}: {
  blockId: string;
  blockData: BlockNodeData;
}) {
  return (
    <ExtractSummaryAction
      blockType={BlockType.X}
      blockId={blockId}
      blockData={blockData}
    />
  );
}
