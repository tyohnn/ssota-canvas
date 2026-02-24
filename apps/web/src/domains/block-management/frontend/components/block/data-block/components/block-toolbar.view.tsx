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
  /** 도형 블록 등 헤더(제목, 배지) 없이 툴바만 표시할 때 사용 */
  hideHeader?: boolean;
  /** 도형 블록 등 바깥 컨테이너(제목+배지+아이콘 전체) 배경/테두리/그림자 숨김. 내부(아이콘 버튼들) 컨테이너는 유지 */
  hideToolbarContainer?: boolean;
}

export function BlockToolbarView({
  className,
  headerContent,
  toolbarItems,
  hideHeader = false,
  hideToolbarContainer = false,
}: BlockToolbarViewProps) {
  return (
    <Box
      className={cn(
        'absolute top-[-47px] left-0 z-50 w-full',
        'pointer-events-auto',
        className
      )}
    >
      {/* 바깥 컨테이너: 제목+배지+아이콘 전체 감쌈. hideToolbarContainer면 스타일 없음 */}
      <Box
        className={cn(
          'w-full flex items-center gap-2 px-1.5 py-0.5',
          hideHeader && 'justify-center',
          !hideToolbarContainer &&
            'bg-background/60 backdrop-blur-md border border-border/75 rounded-md shadow-lg'
        )}
      >
        {!hideHeader && (
          <Box className="flex-1 min-w-0">{headerContent}</Box>
        )}

        {/* 내부 컨테이너: 아이콘 버튼들만 감쌈. 항상 배경/테두리/그림자 유지 */}
        <Box
          className={cn(
            'px-1.5 py-1 flex items-center justify-center gap-0.5',
            'shrink-0',
            'bg-background/70 backdrop-blur-md rounded-md shadow-xl border-border/40 border'
          )}
        >
          <TooltipProvider>{toolbarItems}</TooltipProvider>
        </Box>
      </Box>
    </Box>
  );
}
