'use client';

import React, { useEffect } from 'react';

import { Link as LinkIcon } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
import { Input } from '@workspace/ui/components/ui/input';

import { LinkLoadingState } from './link-loading-state';

export interface LinkEmptyStateProps {
  draftUrl: string;
  isActive: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlSubmit: (e?: { preventDefault(): void }) => Promise<void>;
  onUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Link Empty State Component
 *
 * Presentational: URL input form when no URL is set.
 * Uses LinkLoadingState as background with blur overlay; English labels only.
 */
export function LinkEmptyState({
  draftUrl,
  isActive,
  inputRef,
  onUrlChange,
  onUrlSubmit,
  onUrlKeyDown,
}: LinkEmptyStateProps) {
  useEffect(() => {
    if (isActive && !draftUrl && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive, draftUrl, inputRef]);

  return (
    <Box className="relative w-full h-full min-h-0 flex flex-col overflow-hidden">
      <LinkLoadingState />

      <Box className="absolute inset-0 backdrop-blur-xs bg-white/5 dark:bg-black/40 flex flex-col items-center justify-center p-4 z-10">
        <LinkIcon className="h-12 w-12 shrink-0 text-muted-foreground mb-4" />
        <p className="text-sm font-medium text-foreground mb-3">Enter URL</p>
        <form
          onSubmit={e => {
            e.preventDefault();
            onUrlSubmit(e);
          }}
          className="w-full max-w-sm"
          onClick={e => e.stopPropagation()}
        >
          <Input
            ref={inputRef}
            type="url"
            placeholder="https://..."
            value={draftUrl}
            className="border-ring ring-ring/50 ring-[3px]"
            onChange={onUrlChange}
            onKeyDown={onUrlKeyDown}
            onClick={e => e.stopPropagation()}
          />
          <p className="text-xs text-foreground/80 text-center mt-2">
            Press Enter to save
          </p>
        </form>
      </Box>
    </Box>
  );
}
