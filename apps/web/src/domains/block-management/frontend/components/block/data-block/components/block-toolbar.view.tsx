/**
 * Block Toolbar View
 * 
 * Presentational component for Block Toolbar
 */

'use client';

import React from 'react';
import { Box } from '@/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';

export interface BlockToolbarViewProps {
  className?: string;
  headerContent: React.ReactNode;
  toolbarItems: React.ReactNode;
}

export function BlockToolbarView({
  className,
  headerContent,
  toolbarItems,
}: BlockToolbarViewProps) {
  return (
    <Box
      className={cn(
        'absolute top-[-47px] left-0 z-50 w-full',
        'pointer-events-auto',
        className
      )}
    >
      <Box className="w-full flex items-center gap-2 bg-background/60 backdrop-blur-md border border-border/75 rounded-md shadow-lg px-1.5 py-0.5">
        {/* 좌측: BlockHeader (flex-1으로 나머지 공간 사용) */}
        <Box className="flex-1 min-w-0">
          {headerContent}
        </Box>

        {/* 우측: Toolbar Buttons (고정 너비) - 버튼 영역은 드래그 방지 */}
        <Box
          className={cn(
            'bg-background/70 backdrop-blur-md rounded-md shadow-xl border-border/40 border',
            'px-1.5 py-1 flex items-center justify-center gap-0.5',
            'shrink-0',
            // 'nodrag'
          )}
        >
          <TooltipProvider>
            {toolbarItems}
          </TooltipProvider>
        </Box>
      </Box>
    </Box>
  );
}
