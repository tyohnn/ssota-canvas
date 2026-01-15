'use client';

import React, { useEffect } from 'react';

import { Youtube } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';

import { YoutubeLoadingState } from './youtube-loading-state';

interface YoutubeEmptyStateProps {
  draftUrl: string;
  selected: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlSubmit: (e: React.FormEvent) => Promise<void>;
  onUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * YouTube Empty State Component
 *
 * URL이 없을 때 표시되는 입력 폼 컴포넌트
 * LoadingState 스켈레톤을 배경으로 사용하고, blur overlay 위에 입력창 표시
 */
export function YoutubeEmptyState({
  draftUrl,
  selected,
  inputRef,
  onUrlChange,
  onUrlSubmit,
  onUrlKeyDown,
}: YoutubeEmptyStateProps) {
  // Focus input when selected
  useEffect(() => {
    if (selected && !draftUrl && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selected, draftUrl, inputRef]);

  return (
    <Box className="relative w-full h-full flex flex-col">
      {/* 배경: Loading State 스켈레톤 */}
      <YoutubeLoadingState />

      {/* Overlay: blur + 입력창 */}
      <Box className="absolute inset-0 backdrop-blur-xs bg-white/5 dark:bg-black/40 flex flex-col items-center justify-center p-4 z-10">
        <Youtube className="h-12 w-12 shrink-0 text-red-500 mb-4" />
        <p className="text-sm font-medium text-foreground mb-3">
          Enter YouTube URL
        </p>
        <form
          onSubmit={onUrlSubmit}
          className="w-full max-w-sm"
          onClick={e => e.stopPropagation()}
        >
          <Input
            ref={inputRef}
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
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
