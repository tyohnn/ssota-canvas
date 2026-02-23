/**
 * Group Block Toolbar Component
 *
 * 그룹 블록 전용 툴바 레이아웃
 * - 제목 배지: 그룹 내부 좌측 상단 (색상 토큰에 맞춘 배경/텍스트)
 * - 툴바 바: 블록 상단 중앙
 */

'use client';
import { Fragment } from 'react';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { ViewModeToolbarItem } from '../../common-toolbar-items';
import { BlockToolbarMapper } from '../../block-original-toolbar/components/block-toolbar-mapper';

export interface GroupBlockToolbarProps {
  data: BlockNodeData;
  selected: boolean;
  viewMode: BlockViewModeValue;
  onViewModeChange?: (viewMode: BlockViewModeValue) => void;
  width?: number;
  height?: number;
  className?: string;
  zoom: number;
  isMultiSelection: boolean;
  showBlockToolbarMapper?: boolean;
}

export function GroupBlockToolbar({
  data,
  selected,
  viewMode,
  onViewModeChange,
  width,
  height,
  className,
  zoom,
  isMultiSelection,
  showBlockToolbarMapper = false,
}: GroupBlockToolbarProps) {
  const { readonly } = useCanvasReadOnly();

  return (
    <Fragment>
      {/* 툴바 바: 블록 상단 중앙 (제목 배지는 GroupBlock 콘텐츠에 항상 표시) */}
      <Box
        className={cn(
          'absolute top-[-47px] left-0 right-0 z-50 flex justify-center items-center',
          'pointer-events-auto',
          'py-0.5 min-h-[40px]'
        )}
      >
        <Box className="shrink-0 flex items-center gap-0.5 px-1.5 py-1 bg-background/70 backdrop-blur-md rounded-md shadow-xl border border-border/40">
          <TooltipProvider>
            {showBlockToolbarMapper && (
              <BlockToolbarMapper
                blockId={data.blockId}
                blockType={data.blockType || 'basic'}
                blockData={data}
                width={width}
                height={height}
                zoom={zoom}
                readonly={readonly}
              />
            )}

            {!readonly && onViewModeChange && (
              <ViewModeToolbarItem
                blockType={data.blockType}
                currentViewMode={viewMode}
                onViewModeChange={onViewModeChange}
                zoom={zoom}
              />
            )}
          </TooltipProvider>
        </Box>
      </Box>
    </Fragment>
  );
}
