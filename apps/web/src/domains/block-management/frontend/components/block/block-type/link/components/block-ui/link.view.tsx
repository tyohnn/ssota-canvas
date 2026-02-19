'use client';

import React from 'react';

import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import type { LinkViewProps } from '../../core/types';
import { LinkEmptyState } from './link-empty-state';
import { LinkLoadingState } from './link-loading-state';
import { LinkPreviewCard } from './link-preview-card';
import { Box } from '@/components/ui/box';

/**
 * Link View Component (Presentational)
 *
 * Props only, no hooks. Scenario flags; composes LinkEmptyState, LinkLoadingState, LinkPreviewCard.
 * Container style (border, shadow, selected ring) is applied by OriginalView.
 */
export function LinkView({
  url,
  metadata,
  isLoading,
  draftUrl,
  selected,
  inputRef,
  normalizedDomain,
  currentFaviconUrl,
  isFaviconExhausted,
  handleUrlChange,
  handleUrlSubmit,
  handleUrlKeyDown,
  handleDoubleClick,
  handleFaviconError,
}: LinkViewProps) {
  const shouldShowEmptyState = !url && !isLoading;
  const shouldShowLoadingState = url && isLoading;
  const shouldShowPreviewCard = url && !isLoading && metadata;

  return (
    <TooltipProvider>
      <Box
        className={cn(
          'w-full h-full flex flex-col',
          'transition-[box-shadow,transform] duration-300 ease-out'
        )}
      >
        {shouldShowEmptyState && (
          <LinkEmptyState
            draftUrl={draftUrl}
            selected={selected}
            inputRef={inputRef}
            onUrlChange={handleUrlChange}
            onUrlSubmit={handleUrlSubmit}
            onUrlKeyDown={handleUrlKeyDown}
          />
        )}

        {shouldShowLoadingState && <LinkLoadingState />}

        {shouldShowPreviewCard && metadata && (
          <LinkPreviewCard
            metadata={metadata}
            selected={selected}
            normalizedDomain={normalizedDomain}
            currentFaviconUrl={currentFaviconUrl}
            isFaviconExhausted={isFaviconExhausted}
            onFaviconError={handleFaviconError}
            onDoubleClick={handleDoubleClick}
          />
        )}
      </Box>
    </TooltipProvider>
  );
}
