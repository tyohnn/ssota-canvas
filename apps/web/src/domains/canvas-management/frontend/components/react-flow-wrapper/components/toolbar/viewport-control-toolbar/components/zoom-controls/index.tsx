import React from 'react';

import { ZoomInButton } from './zoom-in-button';
import { ZoomLevelDisplay } from './zoom-level-display';
import { ZoomOutButton } from './zoom-out-button';

export interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/**
 * Zoom Controls Component
 *
 * Presentational component: Renders zoom controls (zoom out, level display, zoom in)
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function ZoomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
}: ZoomControlsProps) {
  return (
    <>
      {/* Zoom Out (축소) - 왼쪽 */}
      <ZoomOutButton onClick={onZoomOut} />

      {/* 줌 레벨 표시 - 중앙 */}
      <ZoomLevelDisplay zoomLevel={zoomLevel} />

      {/* Zoom In (확대) - 오른쪽 */}
      <ZoomInButton onClick={onZoomIn} />
    </>
  );
}
