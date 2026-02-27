'use client';

import React from 'react';

import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

import type { LinkViewProps } from '../logic/types';
import { LinkEmptyState } from './ui-states/link-empty-state';
import { LinkLoadingState } from './ui-states/link-loading-state';
import { LinkPreviewCard } from './link-preview-card';

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
  isActive,
  inputRef,
  normalizedDomain,
  currentFaviconUrl,
  handleUrlChange,
  handleUrlSubmit,
  handleUrlKeyDown,
  handleDoubleClick,
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
            isActive={isActive}
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
            isActive={isActive}
            normalizedDomain={normalizedDomain}
            currentFaviconUrl={currentFaviconUrl}
            onDoubleClick={handleDoubleClick}
          />
        )}
      </Box>
    </TooltipProvider>
  );
}
