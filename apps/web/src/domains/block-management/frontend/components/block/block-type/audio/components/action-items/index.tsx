'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { ExtractSummaryAction } from '@/domains/source-management/frontend/components/extract-summary-action';

export function AudioActionItems({
  blockId,
  blockData,
}: {
  blockId: string;
  blockData: BlockNodeData;
}) {
  return (
    <ExtractSummaryAction
      blockType={BlockType.AUDIO}
      blockId={blockId}
      blockData={blockData}
    />
  );
}
