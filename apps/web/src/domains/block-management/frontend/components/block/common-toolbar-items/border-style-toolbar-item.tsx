'use client';

import React from 'react';

import { ToolbarOptionPopover } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';
import type { ToolbarOption } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';

import type { BorderStyle } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { cn } from '@/lib/utils';

interface BorderStyleToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentBorderStyle: BorderStyle;
  disabled?: boolean;
  onBorderStyleChange?: (borderStyle: BorderStyle) => Promise<void>;
  zoom?: number;
}

const BORDER_STYLE_OPTIONS: ToolbarOption<BorderStyle>[] = [
  {
    value: 'solid',
    label: '실선',
    icon: (
      <div className="flex items-center justify-center w-full h-full">
        <div
          className={cn('w-4 h-0 border-t-2 border-gray-700', 'border-solid')}
        />
      </div>
    ),
  },
  {
    value: 'dashed',
    label: '대시선',
    icon: (
      <div className="flex items-center justify-center w-full h-full">
        <div
          className={cn('w-4 h-0 border-t-2 border-gray-700', 'border-dashed')}
        />
      </div>
    ),
  },
  {
    value: 'dotted',
    label: '점선',
    icon: (
      <div className="flex items-center justify-center w-full h-full">
        <div
          className={cn('w-4 h-0 border-t-2 border-gray-700', 'border-dotted')}
        />
      </div>
    ),
  },
];

export function BorderStyleToolbarItem({
  blockId,
  blockMountId,
  currentBorderStyle,
  disabled = false,
  onBorderStyleChange,
  zoom = 1,
}: BorderStyleToolbarItemProps) {
  const handleBorderStyleChange = async (borderStyle: BorderStyle) => {
    if (onBorderStyleChange) {
      await onBorderStyleChange(borderStyle);
    }
  };

  return (
    <ToolbarOptionPopover<BorderStyle>
      currentValue={currentBorderStyle}
      options={BORDER_STYLE_OPTIONS}
      onValueChange={handleBorderStyleChange}
      tooltip="테두리 스타일"
      tooltipSide="top"
      tooltipOffset={5}
      popoverSide="top"
      popoverAlign="center"
      zoom={zoom}
    />
  );
}
