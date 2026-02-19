'use client';

import React from 'react';

import { YouTubePlayer } from 'react-youtube';

import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';
import type { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import {
  YoutubeEmptyState,
  YoutubeErrorState,
  YoutubeLoadingState,
} from './ui-states';
import { YoutubePreviewCard } from './youtube-preview-card';

export interface YoutubeViewProps {
  // State
  url: string;
  isLoading: boolean;
  hasError: boolean;
  draftUrl: string;
  showPlayer: boolean;
  isIframeLoading: boolean;
  selected: boolean;

  // Properties
  properties: YoutubeBlockProperties;
  thumbnailUrl: string | null;
  videoId: string | null;

  // Refs
  inputRef: React.RefObject<HTMLInputElement | null>;

  // Handlers
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlSubmit: (e?: { preventDefault(): void }) => Promise<void>;
  onUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPlayerReady: (event: { target: YouTubePlayer }) => void;
  onImageLoad: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * YouTube View Component (Presentational)
 *
 * 순수 Presentational 컴포넌트 - props만 받아서 렌더링
 * Container style (border, shadow, selected ring) is applied by OriginalView.
 */
export function YoutubeView({
  url,
  isLoading,
  hasError,
  draftUrl,
  showPlayer,
  isIframeLoading,
  selected,
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
      <div
        className={cn(
          'w-full h-full flex flex-col',
          'transition-[box-shadow,transform] duration-300 ease-out'
        )}
      >
        {shouldShowEmptyState && (
          <YoutubeEmptyState
            draftUrl={draftUrl}
            selected={selected}
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
              <div className="w-full h-full flex flex-col overflow-hidden group">
                <YoutubePreviewCard
                  properties={properties}
                  thumbnailUrl={thumbnailUrl}
                  videoId={videoId}
                  selected={selected}
                  isLoading={isLoading}
                  hasError={hasError}
                  showPlayer={showPlayer}
                  isIframeLoading={isIframeLoading}
                  onPlayerReady={onPlayerReady}
                  onImageLoad={onImageLoad}
                  onImageError={onImageError}
                />
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
