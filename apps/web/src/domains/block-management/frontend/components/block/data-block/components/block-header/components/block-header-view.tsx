'use client';

import React, { useState } from 'react';

import { Badge } from '@workspace/ui/components/ui/badge';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';

export interface BlockHeaderViewProps {
  title: string;
  blockType?: string;
  width?: number;
  onTitleChange: (title: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isUpdating: boolean;
  className?: string;
  readonly?: boolean;
}

/**
 * Block Header View Component
 *
 * Presentational component: Renders the block header input
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function BlockHeaderView({
  title,
  blockType,
  width,
  onTitleChange,
  onKeyDown,
  onBlur,
  inputRef,
  isUpdating,
  className,
  readonly = false,
}: BlockHeaderViewProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur();
  };

  // width가 350px 이하일 때 배지 숨김
  const shouldShowBadge = blockType && width !== undefined && width > 400;

  return (
    <Box
      className={cn(
        'nodrag',
        'flex items-center gap-1',
        'pointer-events-auto',
        'w-full',
        className
      )}
    >
      {/* 블록 타입 배지 */}
      {shouldShowBadge && blockType && (
        <Badge variant="secondary" className="shrink-0 cursor-default">
          {blockType}
        </Badge>
      )}

      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isUpdating}
        readOnly={readonly}
        placeholder="Click to edit"
        className={cn(
          'h-7 px-1 text-sm font-medium',
          'flex-1 min-w-0',
          'bg-transparent',
          'border-0 border-b',
          'outline-none',
          'focus-visible:ring-0',
          'focus-visible:outline-none',
          'placeholder:text-muted-foreground/50',
          readonly ? 'cursor-default' : 'cursor-text',
          'truncate',
          isFocused ? 'border-b-foreground/30' : 'border-b-transparent'
        )}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      />
    </Box>
  );
}
