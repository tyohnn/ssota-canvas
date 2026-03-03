'use client';

import React from 'react';

import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

import type { XViewProps } from '../logic/types';
import { XEmptyState } from './ui-states/x-empty-state';
import { XLoadingState } from './ui-states/x-loading-state';
import { XPreviewCard } from './x-preview-card';

export function XView({
  url,
  metadata,
  isLoading,
  draftUrl,
  isActive,
  inputRef,
  handleUrlChange,
  handleUrlSubmit,
  handleUrlKeyDown,
  handleDoubleClick,
}: XViewProps) {
  const shouldShowEmptyState = !url && !isLoading;
  const shouldShowLoadingState = url && isLoading;
  const shouldShowPreviewCard = url && !isLoading && metadata;

  return (
    <TooltipProvider>
      <Box
        className={cn(
          'w-full h-full flex flex-col min-h-0 overflow-hidden',
          'transition-[box-shadow,transform] duration-300 ease-out'
        )}
      >
        {shouldShowEmptyState && (
          <XEmptyState
            draftUrl={draftUrl}
            isActive={isActive}
            inputRef={inputRef}
            onUrlChange={handleUrlChange}
            onUrlSubmit={handleUrlSubmit}
            onUrlKeyDown={handleUrlKeyDown}
          />
        )}

        {shouldShowLoadingState && <XLoadingState />}

        {shouldShowPreviewCard && metadata && (
          <XPreviewCard
            metadata={metadata}
            isActive={isActive}
            onDoubleClick={handleDoubleClick}
          />
        )}
      </Box>
    </TooltipProvider>
  );
}
