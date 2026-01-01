import React from 'react';

import { ToolbarOptionPopover } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';

import {
  ColorToken,
  getColorLabel,
  getColorPreviewClass,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { cn } from '@/lib/utils';

import type { EdgeColorOption } from '../core/types';

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

// Edge color definitions (GRAY를 맨 앞에 배치)
const EDGE_COLORS: EdgeColorOption[] = [
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

export interface ColorSelectorProps {
  currentColor: ColorToken;
  onColorChange: (color: ColorToken) => void;
  zoom: number;
}

/**
 * Color Selector Component
 *
 * Presentational component: Edge color selection UI
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function ColorSelector({
  currentColor,
  onColorChange,
  zoom,
}: ColorSelectorProps): React.JSX.Element {
  return (
    <ToolbarOptionPopover<ColorToken>
      currentValue={currentColor}
      options={EDGE_COLORS}
      onValueChange={onColorChange}
      tooltip="Edge Color"
      tooltipSide="top"
      tooltipOffset={5}
      popoverSide="top"
      popoverAlign="center"
      zoom={zoom}
      triggerIconClassName="border-1"
    />
  );
}
