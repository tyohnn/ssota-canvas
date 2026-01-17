'use client';

import React from 'react';

import { ToolbarOptionPopover } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';
import type { ToolbarOption } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';

import {
  ColorToken,
  getColorLabel,
  getColorPreviewClass,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { cn } from '@/lib/utils';

interface ColorToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentColor: ColorToken;
  disabled?: boolean;
  onColorChange?: (color: ColorToken) => Promise<void>;
  zoom?: number;
}

/**
 * 각 색상 토큰에 대한 border 클래스 (진한 색상, opacity 적용)
 */
const COLOR_BORDER_CLASSES: Record<ColorToken, string> = {
  [ColorToken.RED]: 'border-red-500/50 dark:border-red-500/50',
  [ColorToken.ORANGE]: 'border-orange-500/50 dark:border-orange-500/50',
  [ColorToken.AMBER]: 'border-amber-500/50 dark:border-amber-500/50',
  [ColorToken.GREEN]: 'border-green-500/50 dark:border-green-500/50',
  [ColorToken.BLUE]: 'border-blue-500/50 dark:border-blue-500/50',
  [ColorToken.PURPLE]: 'border-purple-500/50 dark:border-purple-500/50',
  [ColorToken.PINK]: 'border-pink-500/50 dark:border-pink-500/50',
  [ColorToken.GRAY]: 'border-gray-500/50 dark:border-gray-500/50',
};

// Color options (GRAY를 맨 앞에 배치)
const COLOR_OPTIONS: ToolbarOption<ColorToken>[] = [
  {
    value: ColorToken.GRAY,
    label: getColorLabel(ColorToken.GRAY),
    icon: (
      <div
        className={cn(
          'size-8 rounded border-2',
          getColorPreviewClass(ColorToken.GRAY),
          COLOR_BORDER_CLASSES[ColorToken.GRAY]
        )}
      />
    ),
  },
  ...Object.values(ColorToken)
    .filter(token => token !== ColorToken.GRAY)
    .map(token => ({
      value: token,
      label: getColorLabel(token),
      icon: (
        <div
          className={cn(
            'size-8 rounded border-2',
            getColorPreviewClass(token),
            COLOR_BORDER_CLASSES[token]
          )}
        />
      ),
    })),
];

export function ColorToolbarItem({
  blockId,
  blockMountId,
  currentColor,
  disabled = false,
  onColorChange,
  zoom = 1,
}: ColorToolbarItemProps) {
  const handleColorChange = async (color: ColorToken) => {
    if (onColorChange) {
      await onColorChange(color);
    }
  };

  return (
    <ToolbarOptionPopover<ColorToken>
      currentValue={currentColor}
      options={COLOR_OPTIONS}
      onValueChange={handleColorChange}
      tooltip="색상"
      tooltipSide="top"
      tooltipOffset={5}
      popoverSide="top"
      popoverAlign="center"
      zoom={zoom}
      triggerIconClassName="border-1"
    />
  );
}
