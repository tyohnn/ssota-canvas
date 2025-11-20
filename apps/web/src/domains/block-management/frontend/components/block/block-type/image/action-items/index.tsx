import React from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { ImageKeywordSearchAction } from './image-search-action/keyword-search-action';
import { ImageSemanticSearchAction } from './image-search-action/semantic-search-action';
import { GenerateImageAction } from './generate-image-action/index';
import { SearchImageStyleAction } from './search-image-style-action';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function ImageActionItems({
  blockId,
  blockData,
}: {
  blockId: string;
  blockData: BlockNodeData;
}) {
  const { orgId, workspaceId } = blockData;

  return (
    <>
      <ImageKeywordSearchAction
        blockIds={[blockId]}
        orgId={orgId}
        workspaceId={workspaceId}
      />
      <ImageSemanticSearchAction
        blockIds={[blockId]}
        orgId={orgId}
        workspaceId={workspaceId}
      />
      <GenerateImageAction
        blockIds={[blockId]}
        orgId={orgId}
        workspaceId={workspaceId}
      />
      <SearchImageStyleAction blockId={blockId} blockData={blockData} />
    </>
  );
}
