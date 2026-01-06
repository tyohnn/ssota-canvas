import React from 'react';

import { Map } from 'lucide-react';

import { ToolbarIconButton } from '@/components/ssota-ui/toolbar-icon-button';

export interface MinimapToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
}

/**
 * Minimap Toggle Button Component
 *
 * Presentational component: Renders minimap toggle button
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function MinimapToggleButton({
  isActive,
  onClick,
}: MinimapToggleButtonProps) {
  return (
    <ToolbarIconButton
      icon={<Map className="h-4 w-4" />}
      tooltip="Minimap"
      onClick={onClick}
      tooltipSide="top"
      className="h-8 w-8 p-0 rounded-sm transition-colors"
      variant={isActive ? 'default' : 'ghost'}
      isActive={isActive}
      aria-label="Toggle Minimap"
    />
  );
}
