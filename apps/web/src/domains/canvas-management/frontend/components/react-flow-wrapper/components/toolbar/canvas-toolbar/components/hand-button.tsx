import React from 'react';

import { Hand } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

export interface HandButtonProps {
  isActive: boolean;
  onClick: () => void;
}

/**
 * Hand Button Component
 *
 * Presentational component: Renders hand (panning) button
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function HandButton({ isActive, onClick }: HandButtonProps) {
  return (
    <ToolbarIconButton
      icon={<Hand className="h-4 w-4" />}
      tooltip="Hand (Space)"
      tooltipSide="top"
      tooltipOffset={5}
      onClick={onClick}
      isActive={isActive}
      className="h-8 w-8 p-0 rounded-sm"
      aria-label="Hand"
    />
  );
}
