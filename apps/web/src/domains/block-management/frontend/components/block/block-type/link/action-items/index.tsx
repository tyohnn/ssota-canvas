import React from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { SummarizeLinkAction } from './summarize-link-action';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function LinkActionItems({
  blockId,
  blockData,
}: {
  blockId: string;
  blockData: BlockNodeData;
}) {
  return (
    <>
      <SummarizeLinkAction blockId={blockId} blockData={blockData} />
    </>
  );
}
