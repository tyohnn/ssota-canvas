'use client';

import React from 'react';

import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

import { formatRelativeTime } from '../logic/utils';
import type { YoutubeMetadata } from '../logic/types';
import { YoutubePlayerOverlay } from './youtube-player-overlay';

export interface YoutubePreviewCardProps {
  properties: YoutubeMetadata;
  thumbnailUrl: string | null;
  videoId: string | null;
  isActive: boolean;
  isLoading: boolean;
  hasError: boolean;
  showPlayer: boolean;
  isIframeLoading: boolean;
  onPlayerReady: (event: { target: import('../logic/types').YouTubePlayer }) => void;
  onImageLoad: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * YouTube Preview Card Component
 */
export function YoutubePreviewCard({
  properties,
  thumbnailUrl,
  videoId,
  isActive,
  isLoading,
  hasError,
  showPlayer,
  isIframeLoading,
  onPlayerReady,
  onImageLoad,
  onImageError,
}: YoutubePreviewCardProps) {
  const { url: _, youtubeId: __, ...metadata } = properties;

  return (
    <>
      <Box className="flex-1 relative min-h-0">
        {isLoading && (
          <Box className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 pointer-events-none">
            <Box className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </Box>
        )}

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

      <Box className="p-3 flex items-start gap-3 bg-background border-t border-border">
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
