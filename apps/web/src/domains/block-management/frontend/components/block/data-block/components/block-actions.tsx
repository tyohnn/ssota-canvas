/**
 * Block Actions Component
 *
 * 블록 상단 우측에 표시되는 액션 버튼들 (더보기, 보기 방식 변경, 에디터 열기)
 */

'use client';

import { useRef } from 'react';

import { Edit } from 'lucide-react';

import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';

import {
  MoreMenuToolbarItem,
  ViewModeToolbarItem,
} from '../../common-toolbar-items';

export interface BlockActionsProps {
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
}

export function BlockActions({
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
}: BlockActionsProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 렌더링 조건 체크
  if (!selected) {
    return null;
  }

  // 멀티셀렉트일 때는 표시하지 않음
  if (isMultiSelection) {
    return null;
  }

  // zoom이 80% 이하일 때는 표시하지 않음
  if (zoom <= 0.8) {
    return null;
  }

  return (
    <Box
      className={cn(
        'absolute top-[-40px] right-0 z-50',
        'pointer-events-auto',
        'nodrag',
        className
      )}
    >
      <ToolbarContainer
        toolbarRef={toolbarRef}
        preventDrag
        preventMouseDown
        preventClick
        className="px-1 py-1 cursor-default gap-0.5"
      >
        <TooltipProvider>
          {/* 보기 방식 변경 */}
          {onViewModeChange && (
            <ViewModeToolbarItem
              blockType={data.blockType}
              currentViewMode={viewMode}
              onViewModeChange={onViewModeChange}
              zoom={zoom}
            />
          )}

          {/* 에디터 열기 */}
          <ToolbarIconButton
            icon={<Edit />}
            tooltip="Edit"
            tooltipSide="top"
            tooltipOffset={5}
            onClick={() => {
              onEdit();
            }}
            onMouseDown={e => e.stopPropagation()}
            className="h-6 w-6 p-0 rounded-sm"
            iconClassName="size-3.5"
          />

          {/* 더보기 메뉴 */}
          <MoreMenuToolbarItem
            blockId={data.blockId}
            blockMountId={data.blockMountId}
            width={width}
            height={height}
          />
        </TooltipProvider>
      </ToolbarContainer>
    </Box>
  );
}
