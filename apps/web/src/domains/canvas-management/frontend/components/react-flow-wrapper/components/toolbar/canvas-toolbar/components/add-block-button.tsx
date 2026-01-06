import React from 'react';

import { Plus } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

export interface AddBlockButtonProps {
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
}

/**
 * Add Block Button Component
 *
 * Presentational component: Renders add block button
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function AddBlockButton({
  isActive,
  disabled,
  onClick,
}: AddBlockButtonProps) {
  return (
    <ToolbarIconButton
      icon={<Plus className="h-4 w-4" />}
      tooltip="Add Block"
      tooltipSide="top"
      tooltipOffset={5}
      onClick={onClick}
      isActive={isActive}
      disabled={disabled}
      className="h-8 w-8 p-0 rounded-sm"
      aria-label="Add Block"
    />
  );
}
