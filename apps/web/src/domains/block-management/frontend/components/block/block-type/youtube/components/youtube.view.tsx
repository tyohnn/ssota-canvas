'use client';

import React from 'react';

import { YouTubePlayer } from 'react-youtube';

import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';
import type { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import { YoutubeEmptyState } from './youtube-empty-state';
import { YoutubeErrorState } from './youtube-error-state';
import { YoutubeLoadingState } from './youtube-loading-state';
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
  onUrlSubmit: (e: React.FormEvent) => Promise<void>;
  onUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPlayerReady: (event: { target: YouTubePlayer }) => void;
  onImageLoad: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * YouTube View Component (Presentational)
 *
 * 순수 Presentational 컴포넌트 - props만 받아서 렌더링
 * 비즈니스 로직 없음, 훅 없음
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
  // 공통 스타일 클래스 (모든 YouTube 블록 상태에 공통 적용)
  const getCommonContainerClasses = (additionalClasses?: string) => {
    return cn(
      'w-full h-full rounded-lg',
      'bg-background border-2 border-border',
      'shadow-md',
      // 호버 효과 (선택되지 않았을 때만)
      !selected && 'hover:shadow-xl',
      // 선택 효과
      selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
      selected && 'shadow-xl',
      // Transition
      'transition-all duration-300 ease-out',
      additionalClasses
    );
  };

  // 시나리오별 렌더링 조건 변수화
  const hasUrl = !!url;
  const hasVideoId = !!videoId;

  // 시나리오 1: Empty State (URL 없음)
  const shouldShowEmptyState = !hasUrl && !isLoading;

  // 시나리오 2: Loading State (URL이 있고 로딩 중일 때 - 처음 입력 또는 툴바에서 변경)
  const shouldShowLoadingState = isLoading && hasUrl;

  // 시나리오 3/4: Preview or Error State (URL이 있고 로딩이 아닐 때)
  const shouldShowPreviewOrErrorState = hasUrl && !isLoading;

  // Error State (URL은 있지만 videoId가 없고 로딩이 아닐 때)
  const isInvalidUrl = !hasVideoId;

  return (
    <TooltipProvider>
      <div
        className={cn(
          'w-full h-full flex flex-col',
          // 레이아웃 변화(width/height)에는 transition을 적용하지 않고
          // 시각 효과에만 transition 적용하여 리사이즈 시 렌더링 지연 방지
          'transition-[box-shadow,transform] duration-300 ease-out'
        )}
      >
        {/* 시나리오 1: Empty State */}
        {shouldShowEmptyState && (
          <Box
            className={getCommonContainerClasses(
              'flex flex-col overflow-hidden'
            )}
          >
            <YoutubeEmptyState
              draftUrl={draftUrl}
              selected={selected}
              inputRef={inputRef}
              onUrlChange={onUrlChange}
              onUrlSubmit={onUrlSubmit}
              onUrlKeyDown={onUrlKeyDown}
            />
          </Box>
        )}

        {/* 시나리오 2: Loading State (URL이 있고 로딩 중일 때 - 처음 입력 또는 툴바에서 변경) */}
        {shouldShowLoadingState && (
          <Box
            className={getCommonContainerClasses(
              'flex flex-col overflow-hidden'
            )}
          >
            <YoutubeLoadingState />
          </Box>
        )}

        {/* 시나리오 3/4: Preview or Error State */}
        {shouldShowPreviewOrErrorState && (
          <>
            {/* 유효하지 않은 URL인 경우 에러 상태 표시 */}
            {isInvalidUrl ? (
              <Box
                className={cn(
                  getCommonContainerClasses(
                    'flex flex-col items-center justify-center p-4'
                  ),
                  'border-red-500' // 에러 상태는 빨간색 border
                )}
              >
                <YoutubeErrorState />
              </Box>
            ) : (
              <Box
                className={getCommonContainerClasses(
                  'flex flex-col overflow-hidden group'
                )}
              >
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
              </Box>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
