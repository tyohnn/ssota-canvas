import React from 'react';

import { Maximize } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

export interface FitToViewButtonProps {
  onClick: () => void;
}

/**
 * Fit to View Button Component
 *
 * Presentational component: Renders fit to view button
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function FitToViewButton({ onClick }: FitToViewButtonProps) {
  return (
    <ToolbarIconButton
      icon={<Maximize className="h-4 w-4" />}
      tooltip="Fit to View (F)"
      tooltipSide="top"
      tooltipOffset={5}
      onClick={onClick}
      className="h-8 w-8 p-0 rounded-sm"
      aria-label="Fit to View"
    />
  );
}
