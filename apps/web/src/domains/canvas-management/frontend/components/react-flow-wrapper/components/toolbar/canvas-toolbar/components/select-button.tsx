import React from 'react';

import { MousePointer } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

export interface SelectButtonProps {
  isActive: boolean;
  onClick: () => void;
}

/**
 * Select Button Component
 *
 * Presentational component: Renders select button
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function SelectButton({ isActive, onClick }: SelectButtonProps) {
  return (
    <ToolbarIconButton
      icon={<MousePointer className="h-4 w-4" />}
      tooltip="Select"
      tooltipSide="top"
      tooltipOffset={5}
      onClick={onClick}
      isActive={isActive}
      className="h-8 w-8 p-0 rounded-sm"
      aria-label="Select"
    />
  );
}
