import { useTheme } from 'next-themes';

import { useReactFlow } from '@xyflow/react';

import {
  getHexColor,
  getHexColorDark,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';

import type {
  CustomEdgeHookProps,
  ThemeDependencies,
  UseCustomEdgeReturn,
} from './types';
import { useCustomEdgeUI } from './use-custom-edge.ui';
import { useEdgePath } from './use-edge-path';

/**
 * Custom Edge Hook
 *
 * Integrates UI state for the custom edge component.
 * This hook provides edge rendering state and label data.
 *
 * @param props - Edge configuration and required parameters
 *
 * @returns Object containing edge UI state and edge state information
 *
 * @example
 * ```tsx
 * // Basic usage (Production)
 * function MyEdge(props: EdgeProps) {
 *   const edge = useCustomEdge({
 *     edgeId: props.id,
 *     sourceX: props.sourceX,
 *     // ... other props
 *   });
 *
 *   return <CustomEdgeView {...edge} />;
 * }
 * ```
 */
export function useCustomEdge(props: CustomEdgeHookProps): UseCustomEdgeReturn {
  const {
    edgeId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    selected,
  } = props;

  // 1. Gather External Dependencies (Centralized)
  const { theme } = useTheme();
  const { getEdge, getEdges } = useReactFlow();
  const { getSelectionCount } = useCanvasSelection();

  // Get edge metadata
  const edges = getEdges();
  const edge = getEdge(edgeId);

  // Extract edge shape for path calculation
  const edgeShape = (edge?.data?.actualEdgeShape as string) || 'default';

  // 2. Bundle Dependencies into semantic objects (Separated by concern)
  const themeDeps: ThemeDependencies = {
    theme,
    getHexColor,
    getHexColorDark,
  };

  // 3. Path calculation
  const { pathData, forceRenderKey } = useEdgePath({
    edgeId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    edgeShape,
  });

  // 4. UI State (Designer Area) - Visual state only
  const uiState = useCustomEdgeUI({
    style,
    selected: selected ?? false,
    themeDeps,
  });

  // 5. Calculate selection state for toolbar visibility
  const selectedNodeCount = getSelectionCount();
  const selectedEdgeCount = edges.filter(e => e.selected).length;
  const isSingleSelection = selectedNodeCount === 0 && selectedEdgeCount === 1;

  // 6. Get edge label from React Flow (for EdgeLabel component)
  const label = (edge?.label as string) || '';

  // 7. Toolbar visibility
  const showToolbar = !!((selected ?? false) && isSingleSelection && edgeId);

  return {
    pathData,
    forceRenderKey,
    visualState: uiState.visualState,
    style,
    markerEnd: props.markerEnd,
    label,
    showToolbar,
    edgeId,
  };
}
