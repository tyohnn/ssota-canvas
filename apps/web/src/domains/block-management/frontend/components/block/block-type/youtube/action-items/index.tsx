import React from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { ExtractScriptAction } from './extract-script-action';
import { SummarizeYoutubeAction } from './summarize-youtube-action';

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
      <ExtractScriptAction blockId={blockId} blockData={blockData} />
      <SummarizeYoutubeAction blockId={blockId} blockData={blockData} />
    </>
  );
}
