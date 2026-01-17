'use client';

import React from 'react';

import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';
import type { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import type { YouTubePlayer } from '../core/types';
import { formatRelativeTime } from '../core/utils';
import { YoutubePlayerOverlay } from './youtube-player-overlay';

interface YoutubePreviewCardProps {
  properties: YoutubeBlockProperties;
  thumbnailUrl: string | null;
  videoId: string | null;
  selected: boolean;
  isLoading: boolean;
  hasError: boolean;
  showPlayer: boolean;
  isIframeLoading: boolean;
  onPlayerReady: (event: { target: YouTubePlayer }) => void;
  onImageLoad: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * YouTube Preview Card Component
 *
 * YouTube 영상 프리뷰 카드 컴포넌트
 */
export function YoutubePreviewCard({
  properties,
  thumbnailUrl,
  videoId,
  selected,
  isLoading,
  hasError,
  showPlayer,
  isIframeLoading,
  onPlayerReady,
  onImageLoad,
  onImageError,
}: YoutubePreviewCardProps) {
  // Display metadata (url, youtubeId 제외)
  const { url: _, youtubeId: __, ...metadata } = properties;
  return (
    <>
      {/* 플레이어 영역 */}
      <Box className="flex-1 relative min-h-0">
        {/* URL 변경 중 로딩 오버레이 (플레이어 위에 표시) */}
        {isLoading && (
          <Box className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 pointer-events-none">
            <Box className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </Box>
        )}

        {/* react-youtube 플레이어 (항상 렌더링, 재생 상태 유지) */}
        {videoId && (
          <Box
            className={cn(
              'absolute inset-0',
              !showPlayer && 'pointer-events-none opacity-0 z-0',
              showPlayer && 'pointer-events-auto opacity-100 z-10'
            )}
          >
            <YoutubePlayerOverlay
              videoId={videoId}
              title={metadata.youtubeTitle || 'YouTube video player'}
              isLoading={isIframeLoading}
              onReady={onPlayerReady}
            />
          </Box>
        )}

        {/* 썸네일 overlay (플레이어가 숨겨졌을 때만 표시) */}
        {!showPlayer && thumbnailUrl && (
          <Box className="absolute inset-0 bg-black z-20 pointer-events-auto">
            <img
              src={thumbnailUrl}
              alt={metadata.youtubeTitle || 'YouTube thumbnail'}
              className="w-full h-full object-cover"
              onLoad={onImageLoad}
              onError={onImageError}
            />
          </Box>
        )}
      </Box>

      {/* 하단 메타 정보 (YouTube 썸네일 UX) */}
      <Box className="p-3 flex items-start gap-3 bg-background border-t border-border">
        {/* 채널 아바타 */}
        {metadata.channelThumbnail ? (
          <img
            src={metadata.channelThumbnail}
            alt=""
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <Box className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
        )}
        <Box className="min-w-0 flex-1">
          <h3
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 leading-snug"
            title={metadata.youtubeTitle || 'YouTube Video'}
          >
            {metadata.youtubeTitle || 'YouTube Video'}
          </h3>
          <Box className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {metadata.channelName && (
              <span className="truncate max-w-[50%]">
                {metadata.channelName}
              </span>
            )}
            {metadata.channelName &&
              (metadata.viewCount || metadata.publishedAt) && <span>•</span>}
            {metadata.viewCount && (
              <span>{metadata.viewCount.toLocaleString()} views</span>
            )}
            {metadata.viewCount && metadata.publishedAt && <span>•</span>}
            {metadata.publishedAt && (
              <span>{formatRelativeTime(metadata.publishedAt)}</span>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
