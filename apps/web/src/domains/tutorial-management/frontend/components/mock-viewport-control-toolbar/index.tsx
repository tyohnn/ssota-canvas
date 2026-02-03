'use client';

import { useRef } from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { ViewportControlToolbarView } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/viewport-control-toolbar/components';
import { InteractionGuard } from '../common/interaction-guard';

/**
 * Props for MockViewportControlToolbar when connected to ReactFlow zoom
 */
export interface MockViewportControlToolbarProps {
  /** Zoom level 0–1 (displayed as percentage). When provided, overrides default. */
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
}

/**
 * Mock Viewport Control Toolbar
 *
 * Tutorial-specific mock using real ViewportControlToolbarView.
 * Accepts optional zoom/ handlers; when not provided uses defaults (static 100%, no-ops).
 */
export function MockViewportControlToolbar({
  zoomLevel: zoomLevelProp,
  onZoomIn: onZoomInProp,
  onZoomOut: onZoomOutProp,
  onFitToScreen: onFitToScreenProp,
}: MockViewportControlToolbarProps = {}) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const minimapRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const zoomLevel = zoomLevelProp ?? 1;
  const onZoomIn = onZoomInProp ?? (() => {});
  const onZoomOut = onZoomOutProp ?? (() => {});
  const onFitToScreen = onFitToScreenProp ?? (() => {});

  return (
    <InteractionGuard selector="viewport-toolbar">
      <ViewportControlToolbarView
        zoomLevel={zoomLevel}
        showMiniMap={false}
        toolbarRef={toolbarRef}
        minimapRef={minimapRef}
        containerRef={containerRef}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFitToScreen={onFitToScreen}
        onToggleMiniMap={() => {}}
      />
    </InteractionGuard>
  );
}

/**
 * Viewport toolbar connected to ReactFlow zoom.
 * Must be rendered inside a ReactFlow tree (e.g. inside Panel).
 */
export function MockViewportControlToolbarConnected() {
  const { zoom } = useViewport();
  const reactFlow = useReactFlow();

  const onZoomIn = () => {
    try {
      reactFlow.zoomIn({ duration: 300 });
    } catch {
      // no-op when outside ReactFlow
    }
  };

  const onZoomOut = () => {
    try {
      reactFlow.zoomOut({ duration: 300 });
    } catch {
      // no-op
    }
  };

  const onFitToScreen = () => {
    try {
      reactFlow.fitView({ duration: 500, padding: 0.1 });
    } catch {
      // no-op
    }
  };

  return (
    <MockViewportControlToolbar
      zoomLevel={zoom}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onFitToScreen={onFitToScreen}
    />
  );
}
