import React from 'react';

import { Box } from '@/components/ui/box';

export interface ZoomLevelDisplayProps {
  zoomLevel: number;
}

/**
 * Zoom Level Display Component
 *
 * Presentational component: Renders zoom level display
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function ZoomLevelDisplay({ zoomLevel }: ZoomLevelDisplayProps) {
  return (
    <Box className="flex items-center justify-center min-w-12 px-1">
      <span className="text-xs tabular-nums font-medium">
        {Math.round(zoomLevel * 100)}%
      </span>
    </Box>
  );
}
