/**
 * View Mode Toolbar Item Component
 *
 * 보기 방식 변경 팝오버
 * 엣지 툴바와 동일한 스타일 사용 (ToolbarOptionPopover)
 */

'use client';

import { FileText, LayoutGrid, Square } from 'lucide-react';

import { ToolbarOptionPopover } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';
import type { ToolbarOption } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';

import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import { BLOCK_VIEW_MODES } from '@/domains/block-management/shared/types/block-view-modes';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';

export interface ViewModeToolbarItemProps {
  blockType: BlockType;
  currentViewMode: BlockViewModeValue;
  onViewModeChange: (viewMode: BlockViewModeValue) => void;
  zoom: number;
}

const VIEW_MODE_LABELS: Record<BlockViewModeValue, string> = {
  note: 'note',
  original: 'original',
  card: 'card',
};

const VIEW_MODE_ICONS: Record<BlockViewModeValue, typeof LayoutGrid> = {
  note: FileText,
  original: Square,
  card: LayoutGrid,
};

export function ViewModeToolbarItem({
  blockType,
  currentViewMode,
  onViewModeChange,
  zoom,
}: ViewModeToolbarItemProps) {
  const availableModes = BLOCK_VIEW_MODES[blockType] || ['original'];

  if (availableModes.length <= 1) {
    return null; // View Mode가 1개만 있으면 표시하지 않음
  }

  // ToolbarOptionPopover용 옵션 생성
  const options: ToolbarOption<BlockViewModeValue>[] = availableModes.map(
    mode => ({
      value: mode,
      label: VIEW_MODE_LABELS[mode],
      icon: (() => {
        const Icon = VIEW_MODE_ICONS[mode];
        return <Icon />;
      })(),
    })
  );

  return (
    <ToolbarOptionPopover<BlockViewModeValue>
      currentValue={currentViewMode}
      options={options}
      onValueChange={mode => {
        onViewModeChange(mode);
      }}
      tooltip="View Mode"
      tooltipSide="top"
      tooltipOffset={5}
      popoverSide="top"
      popoverAlign="center"
      zoom={zoom}
      triggerClassName="h-6 w-6 p-0 rounded-sm"
      triggerIconClassName="size-3.5"
      optionButtonClassName="size-12"
      optionIconClassName="size-6"
    />
  );
}
