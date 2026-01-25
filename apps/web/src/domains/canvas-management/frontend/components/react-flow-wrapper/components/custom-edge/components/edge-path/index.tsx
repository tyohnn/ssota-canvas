import React, { memo } from 'react';

import { BaseEdge } from '@xyflow/react';

/**
 * Edge Path Component
 *
 * Presentational component: Renders the BaseEdge with styling
 * - Props only, no hooks or context
 * - Storybook testable
 *
 * Path: source → target (useEdgePath). BaseEdge:
 * - markerStart = path 시작 = source
 * - markerEnd   = path 끝   = target
 */
export interface EdgePathProps {
  edgeId: string;
  path: string;
  forceRenderKey: string;
  style: React.CSSProperties;
  markerEnd?: string | { type?: string; width?: number; height?: number; color?: string };
  markerStart?: string | { type?: string; width?: number; height?: number; color?: string };
}

function EdgePathComponent({
  edgeId,
  path,
  forceRenderKey,
  style,
  markerEnd,
  markerStart,
}: EdgePathProps): React.JSX.Element {
  return (
    <BaseEdge
      id={edgeId}
      path={path}
      markerEnd={markerEnd as React.ComponentProps<typeof BaseEdge>['markerEnd']}
      markerStart={markerStart as React.ComponentProps<typeof BaseEdge>['markerStart']}
      key={forceRenderKey}
      style={style}
    />
  );
}

export const EdgePath = memo(EdgePathComponent);
