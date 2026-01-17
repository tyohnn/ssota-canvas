import React from 'react';

import { MiniMap } from '@xyflow/react';

import { Box } from '@/components/ui/box';

export interface MinimapProps {
  minimapRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Minimap Component
 *
 * Presentational component: Renders minimap
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function Minimap({ minimapRef }: MinimapProps) {
  return (
    <Box
      ref={minimapRef}
      className="w-48 h-32 bg-background/95 backdrop-blur-sm border border-border/30 rounded-md shadow-lg overflow-hidden"
      style={{ touchAction: 'none' }}
      onWheel={e => e.stopPropagation()}
    >
      <MiniMap />
    </Box>
  );
}
