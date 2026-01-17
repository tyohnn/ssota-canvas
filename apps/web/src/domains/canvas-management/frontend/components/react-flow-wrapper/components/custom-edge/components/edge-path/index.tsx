import React, { memo } from 'react';

import { BaseEdge } from '@xyflow/react';

/**
 * Edge Path Component
 *
 * Presentational component: Renders the BaseEdge with styling
 * - Props only, no hooks or context
 * - Storybook testable
 *
 * Path calculation is handled by parent component (CustomEdge) via useEdgePath hook.
 */
export interface EdgePathProps {
  edgeId: string;
  path: string;
  forceRenderKey: string;
  style: React.CSSProperties;
  markerEnd?: string;
}

function EdgePathComponent({
  edgeId,
  path,
  forceRenderKey,
  style,
  markerEnd,
}: EdgePathProps): React.JSX.Element {
  return (
    <BaseEdge
      id={edgeId}
      path={path}
      markerEnd={markerEnd}
      key={forceRenderKey}
      style={style}
    />
  );
}

export const EdgePath = memo(EdgePathComponent);
