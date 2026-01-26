import React from 'react';

import { EdgeLabelRenderer } from '@xyflow/react';

import { Box } from '@/components/ui/box';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { EdgeLabel } from './edge-label';
import { EdgePath } from './edge-path';
import { EdgeToolbar } from './edge-toolbar';

/**
 * Check if a marker exists (either as URL string or object)
 */
function hasMarker(
  marker: string | { type?: string; width?: number; height?: number; color?: string } | undefined
): boolean {
  if (!marker) return false;
  if (typeof marker === 'object') return true;
  if (typeof marker === 'string' && marker.startsWith('url(')) return true;
  return false;
}

/**
 * Custom Marker Components
 *
 * Renders SVG marker definitions that can be referenced by edge paths.
 * This allows us to dynamically change the marker color based on edge state.
 */

interface MarkerProps {
  id: string;
  color: string;
}

// Closed Arrow (filled triangle)
function ArrowMarker({ id, color }: MarkerProps): React.JSX.Element {
  return (
    <marker
      id={id}
      markerWidth="20"
      markerHeight="20"
      viewBox="-10 -10 20 20"
      orient="auto-start-reverse"
      markerUnits="strokeWidth"
      refX="0"
      refY="0"
    >
      <polyline
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
        fill={color}
        points="-5,-4 0,0 -5,4 -5,-4"
      />
    </marker>
  );
}

// Open Arrow (outline only)
function ArrowOpenMarker({ id, color }: MarkerProps): React.JSX.Element {
  return (
    <marker
      id={id}
      markerWidth="20"
      markerHeight="20"
      viewBox="-10 -10 20 20"
      orient="auto-start-reverse"
      markerUnits="strokeWidth"
      refX="0"
      refY="0"
    >
      <polyline
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        fill="none"
        points="-5,-4 0,0 -5,4"
      />
    </marker>
  );
}

// Circle (filled)
function CircleMarker({ id, color }: MarkerProps): React.JSX.Element {
  return (
    <marker
      id={id}
      markerWidth="20"
      markerHeight="20"
      viewBox="-10 -10 20 20"
      orient="auto-start-reverse"
      markerUnits="strokeWidth"
      refX="0"
      refY="0"
    >
      <circle cx="0" cy="0" r="4" fill={color} stroke={color} strokeWidth="1" />
    </marker>
  );
}

// Circle Open (outline only)
function CircleOpenMarker({ id, color }: MarkerProps): React.JSX.Element {
  return (
    <marker
      id={id}
      markerWidth="20"
      markerHeight="20"
      viewBox="-10 -10 20 20"
      orient="auto-start-reverse"
      markerUnits="strokeWidth"
      refX="0"
      refY="0"
    >
      <circle cx="0" cy="0" r="4" fill="white" stroke={color} strokeWidth="1.5" />
    </marker>
  );
}

// Diamond (filled)
function DiamondMarker({ id, color }: MarkerProps): React.JSX.Element {
  return (
    <marker
      id={id}
      markerWidth="20"
      markerHeight="20"
      viewBox="-10 -10 20 20"
      orient="auto-start-reverse"
      markerUnits="strokeWidth"
      refX="0"
      refY="0"
    >
      <polygon
        points="0,-5 4,0 0,5 -4,0"
        fill={color}
        stroke={color}
        strokeWidth="1"
      />
    </marker>
  );
}

// Diamond Open (outline only)
function DiamondOpenMarker({ id, color }: MarkerProps): React.JSX.Element {
  return (
    <marker
      id={id}
      markerWidth="20"
      markerHeight="20"
      viewBox="-10 -10 20 20"
      orient="auto-start-reverse"
      markerUnits="strokeWidth"
      refX="0"
      refY="0"
    >
      <polygon
        points="0,-5 4,0 0,5 -4,0"
        fill="white"
        stroke={color}
        strokeWidth="1.5"
      />
    </marker>
  );
}

/**
 * Render appropriate marker component based on marker type
 */
function renderMarker(
  id: string,
  color: string,
  markerType?: string
): React.JSX.Element {
  const actualType = markerType || 'arrow';

  switch (actualType) {
    case 'arrow':
      return <ArrowMarker id={id} color={color} />;
    case 'arrow-open':
      return <ArrowOpenMarker id={id} color={color} />;
    case 'circle':
      return <CircleMarker id={id} color={color} />;
    case 'circle-open':
      return <CircleOpenMarker id={id} color={color} />;
    case 'diamond':
      return <DiamondMarker id={id} color={color} />;
    case 'diamond-open':
      return <DiamondOpenMarker id={id} color={color} />;
    default:
      return <ArrowMarker id={id} color={color} />;
  }
}

/**
 * Custom Edge View Props
 *
 * Flat props structure for better clarity and simplicity
 */
export type CustomEdgeViewProps = {
  // Geometry
  edgeId: string;

  // Path data
  edgePath: string;
  labelX: number;
  labelY: number;
  forceRenderKey: string;

  // Visual
  strokeColor: string;
  strokeWidth: number;
  markerEnd?: string | { type?: string; width?: number; height?: number; color?: string };
  markerStart?: string | { type?: string; width?: number; height?: number; color?: string };
  markerEndType?: string;
  markerStartType?: string;
  style?: React.CSSProperties;

  // Label
  label: string;
  isSelected: boolean;

  // Toolbar
  showToolbar: boolean;
  toolbarEdgeId: string;
};

/**
 * Custom Edge View Component
 *
 * Presentational component: Main rendering component for custom edge
 * - Combines EdgePath and EdgeLabel
 * - Conditionally renders EdgeToolbar
 * - Props only, no hooks or context
 * - Storybook testable
 */

export function CustomEdgeView({
  edgeId,
  edgePath,
  labelX,
  labelY,
  forceRenderKey,
  strokeColor,
  strokeWidth,
  markerEnd,
  markerStart,
  markerEndType,
  markerStartType,
  style,
  label,
  isSelected,
  showToolbar,
  toolbarEdgeId,
}: CustomEdgeViewProps): React.JSX.Element {
  const { pageId } = useCanvasMetadata();
  const { readonly } = useCanvasReadOnly();

  // Generate unique marker IDs for this edge
  const markerEndId = `${edgeId}-marker-end`;
  const markerStartId = `${edgeId}-marker-start`;

  // Check if markers exist
  const showMarkerEnd = hasMarker(markerEnd);
  const showMarkerStart = hasMarker(markerStart);

  return (
    <>
      {/* Custom SVG Marker Definitions - rendered inline for dynamic color */}
      <defs>
        {showMarkerEnd && renderMarker(markerEndId, strokeColor, markerEndType)}
        {showMarkerStart && renderMarker(markerStartId, strokeColor, markerStartType)}
      </defs>

      {/* Edge Path */}
      <EdgePath
        edgeId={edgeId}
        path={edgePath}
        forceRenderKey={forceRenderKey}
        markerEnd={showMarkerEnd ? `url(#${markerEndId})` : undefined}
        markerStart={showMarkerStart ? `url(#${markerStartId})` : undefined}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
        }}
      />

      <EdgeLabelRenderer>
        {/* Edge Toolbar (above edge center, only on single selection) - readonly일 때 숨김 */}
        {!readonly && showToolbar && (
          <Box
            className="z-50"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 20}px)`,
              pointerEvents: 'all',
            }}
          >
            <EdgeToolbar edgeId={toolbarEdgeId} pageId={pageId} />
          </Box>
        )}

        {/* Edge Label (center, visibility handled internally) */}
        <EdgeLabel
          edgeId={edgeId}
          label={label}
          position={{ x: labelX, y: labelY }}
          isSelected={isSelected}
          readonly={readonly}
        />
      </EdgeLabelRenderer>
    </>
  );
}
