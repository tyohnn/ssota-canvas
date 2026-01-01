import { useEffect, useMemo, useState } from 'react';

import {
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

import type { EdgePathData, UseEdgePathReturn } from './types';

/**
 * Edge Path Hook
 *
 * Pure path calculation hook for edge rendering.
 * Receives edgeShape as a prop instead of fetching it internally.
 *
 * @param props - Path configuration and required parameters
 *
 * @returns Object containing path data and force render key
 */
export function useEdgePath(props: {
  edgeId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps['sourcePosition'];
  targetPosition: EdgeProps['targetPosition'];
  edgeShape: string;
}): UseEdgePathReturn {
  // 4. Path Calculation (UI Logic - Pure calculation)
  const {
    edgeId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    edgeShape,
  } = props;

  // Force render state (for edge shape changes)
  const [forceRender, setForceRender] = useState(0);

  // Detect edge shape changes and force re-render
  useEffect(() => {
    setForceRender(prev => prev + 1);
  }, [edgeShape]);

  // Calculate edge path based on shape (useMemo for performance)
  const pathData = useMemo<EdgePathData>(() => {
    let path: string;
    let x: number;
    let y: number;

    switch (edgeShape) {
      case 'straight':
        [path, x, y] = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
        break;
      case 'step':
      case 'smoothstep':
        [path, x, y] = getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });
        break;
      case 'simplebezier':
      case 'default':
      default:
        [path, x, y] = getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });
        break;
    }

    return { edgePath: path, labelX: x, labelY: y };
  }, [
    edgeShape,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    forceRender,
  ]);

  // Force render key for BaseEdge component
  const forceRenderKey = `${edgeId}-${edgeShape}-${forceRender}`;

  return {
    pathData,
    forceRenderKey,
  };
}
