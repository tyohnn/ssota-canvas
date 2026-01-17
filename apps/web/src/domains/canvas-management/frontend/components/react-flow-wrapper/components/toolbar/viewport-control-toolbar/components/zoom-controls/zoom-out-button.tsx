import React from 'react';

import { ZoomOut } from 'lucide-react';

import { ToolbarIconButton } from '@/components/ssota-ui/toolbar-icon-button';

export interface ZoomOutButtonProps {
  onClick: () => void;
}

/**
 * Zoom Out Button Component
 *
 * Presentational component: Renders zoom out button
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function ZoomOutButton({ onClick }: ZoomOutButtonProps) {
  return (
    <ToolbarIconButton
      icon={<ZoomOut className="h-4 w-4" />}
      tooltip="Zoom Out"
      onClick={onClick}
      tooltipSide="top"
      className="h-8 w-8 p-0 rounded-sm"
      aria-label="Zoom Out"
    />
  );
}
