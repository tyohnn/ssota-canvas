/**
 * Group Block Toolbar Component
 *
 * 그룹 블록 전용 툴바 레이아웃
 * - 제목 인풋: 툴바 바와 같은 위계(형제), 좌측 absolute
 * - 툴바 바: 전체 너비, 내부 버튼만 콘텐츠 크기로 중앙 배치
 */

'use client';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';
import { Separator } from '@/components/ui/separator';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { BlockHeader } from './block-header';
import {
  EditorToolbarButton,
  MoreMenuToolbarItem,
  ViewModeToolbarItem,
} from '../../common-toolbar-items';
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
  onEdit: () => void;
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
  onEdit,
  showBlockToolbarMapper = false,
}: GroupBlockToolbarProps) {
  const { readonly } = useCanvasReadOnly();

  return (
    <Box
      className={cn(
        'absolute top-[-47px] left-0 z-50 w-full',
        'pointer-events-auto',
        className
      )}
    >
      {/* 제목 인풋: 툴바 바와 같은 위계(형제), 좌측 absolute */}
      <Box className="absolute left-0 top-0 bottom-0 flex items-center pl-1 max-w-[200px] z-10">
        <BlockHeader
          data={data}
          selected={selected}
          width={width}
          showBadge={false}
        />
      </Box>

      {/* 툴바 바: 전체 너비, 버튼은 콘텐츠 크기만 갖고 중앙 배치 */}
      <Box className="flex justify-center items-center bg-transparent py-0.5 min-h-[40px]">
        <Box className="shrink-0 flex items-center gap-0.5 px-1.5 py-1 bg-background/70 backdrop-blur-md rounded-md shadow-xl border border-border/40">
          <TooltipProvider>
            {showBlockToolbarMapper && (
              <>
                <BlockToolbarMapper
                  blockId={data.blockId}
                  blockType={data.blockType || 'basic'}
                  blockData={data}
                  width={width}
                  height={height}
                  zoom={zoom}
                  readonly={readonly}
                />
                {!readonly && (
                  <Separator orientation="vertical" className="h-4!" />
                )}
              </>
            )}

            {!readonly && onViewModeChange && (
              <ViewModeToolbarItem
                blockType={data.blockType}
                currentViewMode={viewMode}
                onViewModeChange={onViewModeChange}
                zoom={zoom}
              />
            )}

            <EditorToolbarButton
              onClick={() => onEdit()}
              onMouseDown={e => e.stopPropagation()}
            />

            {!readonly && (
              <>
                <Separator orientation="vertical" className="h-4!" />
                <MoreMenuToolbarItem
                  blockId={data.blockId}
                  blockMountId={data.blockMountId}
                  width={width}
                  height={height}
                  parentBlockMountId={data.parentBlockMountId}
                />
              </>
            )}
          </TooltipProvider>
        </Box>
      </Box>
    </Box>
  );
}
