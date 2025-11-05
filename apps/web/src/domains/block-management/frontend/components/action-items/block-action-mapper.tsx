'use client';

import React from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { UnsplashSearchAction } from './image/unsplash-search-action';

export interface BlockActionMapperProps {
  blockId: string;
  blockType: string;
  blockData: BlockNodeData;
  pageId: string;
  orgId: string;
  workspaceId: string;
}

/**
 * BlockActionMapper Component
 *
 * 블록 타입에 따라 적절한 액션 아이템들을 렌더링하는 매퍼 컴포넌트
 */
export function BlockActionMapper({
  blockId,
  blockType,
  blockData,
  pageId,
  orgId,
  workspaceId,
}: BlockActionMapperProps) {
  switch (blockType) {
    case 'image':
      return (
        <>
          <UnsplashSearchAction
            blockId={blockId}
            blockData={blockData}
            pageId={pageId}
            orgId={orgId}
            workspaceId={workspaceId}
          />
          {/* 향후 추가 액션들 */}
        </>
      );

    case 'text':
      return (
        <>
          {/* 텍스트 블록 액션들 */}
        </>
      );

    // ... 다른 블록 타입들

    default:
      return null;
  }
}

