import type { Edge, EdgeProps } from '@xyflow/react';

import type { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';
import type {
  EdgeData,
  EdgeShape,
} from '@/domains/canvas-management/shared/types/common.types';

// =============================================================================
// 1. Atomic Types & Re-exports
// =============================================================================

/**
 * Edge shape type
 * Supported edge shapes for path calculation
 */
export { type EdgeShape };

// =============================================================================
// 2. Domain Models / Entities
// =============================================================================

/**
 * Edge path calculation result
 */
export interface EdgePathData {
  edgePath: string;
  labelX: number;
  labelY: number;
}

/**
 * Edge visual styling state
 */
export interface EdgeVisualState {
  strokeColor: string;
  strokeWidth: number;
  isSelected: boolean;
}

/**
 * Edge metadata extracted from React Flow
 */
export interface EdgeMetadata {
  edgeShape: EdgeShape;
  label: string;
  pageId: string;
  orgId: string;
  workspaceId: string;
}

// =============================================================================
// 3. Dependency Interfaces (External Systems)
// =============================================================================

/**
 * React Flow dependency interface
 * Used to reduce coupling with external library (XYFlow)
 */
export interface FlowDependencies {
  getEdge: (edgeId: string) => Edge | undefined;
  getEdges: () => Edge[];
}

/**
 * Domain logic dependency interface
 * Used to reduce coupling with internal service hooks
 */
export interface DomainDependencies {
  updateEdgeLabel: (edgeId: string, label: string) => Promise<boolean>;
}

/**
 * Theme dependency interface
 * Used to reduce coupling with theme library
 */
export interface ThemeDependencies {
  theme: string | undefined;
  getHexColor: (token: ColorToken) => string;
  getHexColorDark: (token: ColorToken) => string;
}

/**
 * Selection dependency interface
 * Used to check selection state
 */
export interface SelectionDependencies {
  getSelectionCount: () => number;
}

/**
 * UI State dependencies for useCustomEdgeUI
 * (Visual state only - path calculation is handled by EdgePath component)
 */
export interface UIStateDependencies {
  style?: React.CSSProperties;
  selected: boolean | undefined;
  themeDeps: ThemeDependencies;
}

// =============================================================================
// 4. Public Entry Point (Props)
// =============================================================================

/**
 * Custom Edge Hook Props
 */
export interface CustomEdgeHookProps {
  edgeId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps['sourcePosition'];
  targetPosition: EdgeProps['targetPosition'];
  style?: React.CSSProperties;
  markerEnd?: EdgeProps['markerEnd'];
  markerStart?: EdgeProps['markerStart'];
  selected: boolean | undefined;
}

/**
 * Edge Path UI Hook Dependencies
 * (순수 UI 로직 - 의존성 없음)
 */
export interface EdgePathUIDependencies {
  edgeId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgeProps['sourcePosition'];
  targetPosition: EdgeProps['targetPosition'];
  edgeShape: string;
}

/**
 * Edge Path Hook return type
 */
export interface UseEdgePathReturn {
  pathData: EdgePathData;
  forceRenderKey: string;
}

/**
 * Custom Edge Hook return type
 *
 * This interface defines all values returned by the `useCustomEdge` hook.
 * It includes UI state, handler functions, and edge state information.
 */
export interface UseCustomEdgeReturn {
  // Path data
  pathData: EdgePathData;
  forceRenderKey: string;

  // Visual state
  visualState: EdgeVisualState;

  // Style props
  style?: React.CSSProperties;
  markerEnd?: EdgeProps['markerEnd'];
  markerStart?: EdgeProps['markerStart'];

  // Label data
  label: string;

  // Toolbar visibility
  showToolbar: boolean;
  edgeId: string;
}

/**
 * Custom Edge Component Props
 * Extends EdgeProps from React Flow with typed data.
 * EdgeData is defined in @/domains/canvas-management/shared/types/common.types
 */
export interface CustomEdgeProps extends EdgeProps<Edge<EdgeData>> { }
