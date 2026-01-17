import React from 'react';

import { Maximize2 } from 'lucide-react';

import { ToolbarIconButton } from '@/components/ssota-ui/toolbar-icon-button';

export interface FitToScreenButtonProps {
  onClick: () => void;
}

/**
 * Fit to Screen Button Component
 *
 * Presentational component: Renders fit to screen button
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function FitToScreenButton({ onClick }: FitToScreenButtonProps) {
  return (
    <ToolbarIconButton
      icon={<Maximize2 className="h-4 w-4" />}
      tooltip="Fit to Screen"
      onClick={onClick}
      tooltipSide="top"
      className="h-8 w-8 p-0 rounded-sm"
      aria-label="Fit to Screen"
    />
  );
}
