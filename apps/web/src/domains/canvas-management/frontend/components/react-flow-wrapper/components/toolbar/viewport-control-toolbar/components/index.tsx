import React from 'react';

import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';

import { Box } from '@/components/ui/box';

import { ZoomControls } from './zoom-controls';

export interface ViewportControlToolbarViewProps {
  zoomLevel: number;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/**
 * Viewport Controls View Component
 *
 * Presentational component: Renders the viewport control toolbar (zoom in/out only).
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function ViewportControlToolbarView({
  zoomLevel,
  toolbarRef,
  containerRef,
  onZoomIn,
  onZoomOut,
}: ViewportControlToolbarViewProps) {
  return (
    <Box
      ref={containerRef}
      className="flex flex-col items-end gap-2"
      style={{ touchAction: 'none' }}
      onWheel={e => e.stopPropagation()}
    >
      <ToolbarContainer toolbarRef={toolbarRef}>
        <TooltipProvider>
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
          />
        </TooltipProvider>
      </ToolbarContainer>
    </Box>
  );
}
