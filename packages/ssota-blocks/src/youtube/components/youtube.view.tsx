'use client';

import React from 'react';

import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

import type { YoutubeMetadata } from '../logic/types';
import {
  YoutubeEmptyState,
  YoutubeErrorState,
  YoutubeLoadingState,
} from './ui-states';
import { YoutubePreviewCard } from './youtube-preview-card';

export interface YoutubeViewProps {
  url: string;
  isLoading: boolean;
  hasError: boolean;
  draftUrl: string;
  showPlayer: boolean;
  isIframeLoading: boolean;
  isActive: boolean;

  properties: YoutubeMetadata;
  thumbnailUrl: string | null;
  videoId: string | null;

  inputRef: React.RefObject<HTMLInputElement | null>;

  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlSubmit: (e?: { preventDefault(): void }) => Promise<void>;
  onUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPlayerReady: (event: { target: import('../logic/types').YouTubePlayer }) => void;
  onImageLoad: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * YouTube View Component (Presentational)
 */
export function YoutubeView({
  url,
  isLoading,
  hasError,
  draftUrl,
  showPlayer,
  isIframeLoading,
  isActive,
  properties,
  thumbnailUrl,
  videoId,
  inputRef,
  onUrlChange,
  onUrlSubmit,
  onUrlKeyDown,
  onPlayerReady,
  onImageLoad,
  onImageError,
}: YoutubeViewProps) {
  const hasUrl = !!url;
  const hasVideoId = !!videoId;

  const shouldShowEmptyState = !hasUrl && !isLoading;
  const shouldShowLoadingState = isLoading && hasUrl;
  const shouldShowPreviewOrErrorState = hasUrl && !isLoading;
  const isInvalidUrl = !hasVideoId;

  return (
    <TooltipProvider>
      <Box
        className={cn(
          'w-full h-full flex flex-col',
          'transition-[box-shadow,transform] duration-300 ease-out'
        )}
      >
        {shouldShowEmptyState && (
          <YoutubeEmptyState
            draftUrl={draftUrl}
            isActive={isActive}
            inputRef={inputRef}
            onUrlChange={onUrlChange}
            onUrlSubmit={onUrlSubmit}
            onUrlKeyDown={onUrlKeyDown}
          />
        )}

        {shouldShowLoadingState && <YoutubeLoadingState />}

        {shouldShowPreviewOrErrorState && (
          <>
            {isInvalidUrl ? (
              <Box className="w-full h-full flex flex-col flex-1 items-center justify-center p-4 border-red-500 rounded-lg">
                <YoutubeErrorState />
              </Box>
            ) : (
              <Box className="w-full h-full flex flex-col overflow-hidden group">
                <YoutubePreviewCard
                  properties={properties}
                  thumbnailUrl={thumbnailUrl}
                  videoId={videoId}
                  isActive={isActive}
                  isLoading={isLoading}
                  hasError={hasError}
                  showPlayer={showPlayer}
                  isIframeLoading={isIframeLoading}
                  onPlayerReady={onPlayerReady}
                  onImageLoad={onImageLoad}
                  onImageError={onImageError}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </TooltipProvider>
  );
}
