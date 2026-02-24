import React from 'react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { ExtractSummaryAction } from '@/domains/source-management/frontend/components/extract-summary-action';
import { VisualSummaryAction } from './components/visual-summary-action';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function YoutubeActionItems({
  blockId,
  blockData,
}: {
  blockId: string;
  blockData: BlockNodeData;
}) {
  return (
    <>
      <ExtractSummaryAction
        blockType={BlockType.YOUTUBE}
        blockId={blockId}
        blockData={blockData}
      />
      <VisualSummaryAction blockId={blockId} blockData={blockData} />
    </>
  );
}
