import type { EdgeProps } from '@xyflow/react';

import type { EdgePathData as CoreEdgePathData } from '../core/types';

/**
 * Custom Edge View Types
 *
 * Semantic grouping of props for better readability and maintainability.
 * Each type represents a logical group of related properties.
 *
 * Using `type` instead of `interface` for better IDE hover support.
 */

/**
 * Edge geometry data
 * - Position and connection information
 */
export type EdgeGeometry = {
  edgeId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps['sourcePosition'];
  targetPosition: EdgeProps['targetPosition'];
};

/**
 * Edge path data (for View component)
 * - Extends core EdgePathData with forceRenderKey
 */
export type EdgePathData = CoreEdgePathData & {
  forceRenderKey: string;
};

/**
 * Edge visual styling
 * - Appearance and style information
 */
export type EdgeVisual = {
  strokeColor: string;
  strokeWidth: number;
  markerEnd?: string;
  style?: React.CSSProperties;
};

/**
 * Edge label data
 * - Label content and state
 */
export type EdgeLabelData = {
  label: string;
  isSelected: boolean;
};

/**
 * Edge toolbar data
 * - Toolbar visibility and edge ID
 */
export type EdgeToolbarData = {
  showToolbar: boolean;
  edgeId: string;
};

/**
 * Custom Edge View Props
 *
 * Pattern: View (Semantic Grouping)
 * - Props are grouped by semantic meaning
 * - Improves readability and maintainability
 * - Easier to refactor and test
 */
export type CustomEdgeViewProps = {
  geometry: EdgeGeometry;
  pathData: EdgePathData;
  visual: EdgeVisual;
  label: EdgeLabelData;
  toolbar: EdgeToolbarData;
};
