import React from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { ExtractPdfContentAction } from './extract-pdf-content-action';
import { SummarizePdfAction } from './summarize-pdf-action';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
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
