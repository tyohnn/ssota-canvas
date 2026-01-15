'use client';

import React, { memo } from 'react';

import type { NodeProps } from '@xyflow/react';

import type { YoutubeBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { DataBlock } from '../../data-block';
import { CardView } from '../../data-block/components/card-view';
import { YoutubeView } from './components/youtube.view';
import { useYoutubeBlock } from './core/use-youtube-block';

/**
 * YouTube Block Component (Container)
 *
 * YouTube 영상 임베드 블록 컴포넌트
 * - 훅 호출 및 props 배선 담당
 * - Presentational 컴포넌트로 props 전달
 */
export const YoutubeBlock = memo(function YoutubeBlock({
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as YoutubeBlockNodeData;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 410;
  const height = typeof nodeH === 'number' ? nodeH : 288;

  // Main Hook
  const hookResult = useYoutubeBlock({
    nodeData,
    selected,
  });

  // Original View 렌더러
  const renderOriginalView = () => {
    return (
      <YoutubeView
        // State
        url={hookResult.url}
        isLoading={hookResult.isLoading}
        hasError={hookResult.hasError}
        draftUrl={hookResult.draftUrl}
        showPlayer={hookResult.showPlayer}
        isIframeLoading={hookResult.isIframeLoading}
        selected={selected}
        // Properties
        properties={nodeData.properties}
        thumbnailUrl={hookResult.getThumbnailUrl()}
        videoId={hookResult.getVideoId(hookResult.url)}
        // Refs
        inputRef={hookResult.inputRef}
        // Handlers
        onUrlChange={hookResult.handleUrlChange}
        onUrlSubmit={hookResult.handleUrlSubmit}
        onUrlKeyDown={hookResult.handleUrlKeyDown}
        onPlayerReady={hookResult.handlePlayerReady}
        onImageLoad={hookResult.handleImageLoad}
        onImageError={hookResult.handleImageError}
      />
    );
  };

  // Card View 렌더러
  const renderCardView = () => {
    return <CardView data={nodeData} selected={selected} />;
  };

  return (
    <DataBlock
      data={nodeData}
      selected={selected}
      width={width}
      height={height}
      renderOriginalView={renderOriginalView}
      renderCardView={renderCardView}
    />
  );
});
