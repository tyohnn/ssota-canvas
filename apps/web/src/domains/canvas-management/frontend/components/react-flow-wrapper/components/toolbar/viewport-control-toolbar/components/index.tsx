import React from 'react';

import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';

import { Box } from '@/components/ui/box';

import { FitToScreenButton } from './fit-to-screen-button';
import { Minimap } from './minimap';
import { MinimapToggleButton } from './minimap-toggle-button';
import { ZoomControls } from './zoom-controls';

export interface ViewportControlToolbarViewProps {
  zoomLevel: number;
  showMiniMap: boolean;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  minimapRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onToggleMiniMap: () => void;
}

/**
 * Viewport Controls View Component
 *
 * Presentational component: Renders the viewport control toolbar
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function ViewportControlToolbarView({
  zoomLevel,
  showMiniMap,
  toolbarRef,
  minimapRef,
  containerRef,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onToggleMiniMap,
}: ViewportControlToolbarViewProps) {
  return (
    <Box
      ref={containerRef}
      className="flex flex-col items-end gap-2"
      style={{ touchAction: 'none' }}
      onWheel={e => e.stopPropagation()}
    >
      {/* MiniMap positioned above the toolbar */}
      {showMiniMap && <Minimap minimapRef={minimapRef} />}

      {/* Zoom controls toolbar */}
      <ToolbarContainer toolbarRef={toolbarRef}>
        <TooltipProvider>
          {/* Zoom Controls */}
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
          />

          {/* Fit to Screen */}
          <FitToScreenButton onClick={onFitToScreen} />

          {/* MiniMap toggle */}
          <MinimapToggleButton
            isActive={showMiniMap}
            onClick={onToggleMiniMap}
          />
        </TooltipProvider>
      </ToolbarContainer>
    </Box>
  );
}
