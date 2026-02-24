import React from 'react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

import type { BlockType } from '@/domains/block-management/shared/types/block-types';

export interface BlockTypeToolbarButtonProps {
  blockType: BlockType;
  icon: React.ReactNode;
  label: string;
  onClick: (blockType: BlockType) => void;
  isActive: boolean;
  disabled: boolean;
}

/**
 * Block Type Toolbar Button Component
 *
 * Presentational component: Renders a toolbar button for adding a specific block type
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function BlockTypeToolbarButton({
  blockType,
  icon,
  label,
  onClick,
  isActive,
  disabled,
}: BlockTypeToolbarButtonProps) {
  return (
    <ToolbarIconButton
      icon={icon}
      tooltip={`Add ${label}`}
      tooltipSide="top"
      tooltipOffset={5}
      onClick={() => onClick(blockType)}
      isActive={isActive}
      disabled={disabled}
      className="h-8 w-8 p-0 rounded-sm"
      aria-label={`Add ${label}`}
    />
  );
}
