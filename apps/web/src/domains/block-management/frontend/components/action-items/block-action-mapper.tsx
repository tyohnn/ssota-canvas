'use client';

import React from 'react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { UnsplashSearchAction } from './image/unsplash-search-action';
import { GenerateImageAction } from './image/generate-image-action';
import { SearchImageStyleAction } from './image/search-image-style-action';
import { ExtractScriptAction } from './youtube/extract-script-action';
import { SummarizeYoutubeAction } from './youtube/summarize-youtube-action';
import { ExtractPdfContentAction } from './pdf/extract-pdf-content-action';
import { SummarizePdfAction } from './pdf/summarize-pdf-action';
import { SummarizeLinkAction } from './link/summarize-link-action';

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
          <UnsplashSearchAction blockId={blockId} blockData={blockData} />
          <GenerateImageAction blockId={blockId} blockData={blockData} />
          <SearchImageStyleAction blockId={blockId} blockData={blockData} />
        </>
      );

    case 'youtube':
      return (
        <>
          <ExtractScriptAction blockId={blockId} blockData={blockData} />
          <SummarizeYoutubeAction blockId={blockId} blockData={blockData} />
        </>
      );

    case 'pdf':
      return (
        <>
          <ExtractPdfContentAction blockId={blockId} blockData={blockData} />
          <SummarizePdfAction blockId={blockId} blockData={blockData} />
        </>
      );

    case 'link':
      return (
        <>
          <SummarizeLinkAction blockId={blockId} blockData={blockData} />
        </>
      );

    case 'text':
      return <>{/* 텍스트 블록 액션들 */}</>;

    case 'markdown':
      return <>{/* 마크다운 블록 액션들 */}</>;

    default:
      return null;
  }
}
