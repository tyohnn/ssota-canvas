import React from 'react';

import { ZoomIn } from 'lucide-react';

import { ToolbarIconButton } from '@/components/ssota-ui/toolbar-icon-button';

export interface ZoomInButtonProps {
  onClick: () => void;
}

/**
 * Zoom In Button Component
 *
 * Presentational component: Renders zoom in button
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function ZoomInButton({ onClick }: ZoomInButtonProps) {
  return (
    <ToolbarIconButton
      icon={<ZoomIn className="h-4 w-4" />}
      tooltip="Zoom In"
      onClick={onClick}
      tooltipSide="top"
      className="h-8 w-8 p-0 rounded-sm"
      aria-label="Zoom In"
    />
  );
}
