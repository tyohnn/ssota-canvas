/**
 * Custom Edge Component
 *
 * Container component that provides custom edge rendering with label editing.
 * All business logic and side effects are handled in the hook.
 *
 * Features:
 * - Edge path rendering (Bezier, Straight, SmoothStep)
 * - Edge label editing (click to edit, Enter/Escape to save/cancel)
 * - Edge toolbar display (on single selection)
 * - Visual state management (stroke color, width based on selection)
 *
 * @see 03-user-flow.md - Screen 3: 엣지 편집 모드
 * @see https://reactflow.dev/examples/edges/edge-label-renderer
 * @see https://reactflow.dev/learn/customization/edge-labels
 */

'use client';

import React, { memo } from 'react';

import { CustomEdgeView } from './components/custom-edge-view';
import type { CustomEdgeProps } from './core/types';
import { useCustomEdge } from './core/use-custom-edge';

/**
 * Custom Edge Container Component
 *
 * This is a pure Container component that:
 * - Uses the hook to get all state and handlers
 * - Passes them as props to Presentational components
 *
 * Pattern: Container (Thin)
 * - Minimal destructuring
 * - Connects Hook → View
 * - Maintains library interface compatibility
 *
 * All side effects and business logic are handled in the hook.
 */
export const CustomEdge = memo(function CustomEdge(props: CustomEdgeProps) {
  // Container (Thin): 훅에 필요한 것만 추출
  const { id, selected } = props;

  // Hook: 비즈니스 로직 처리
  const {
    pathData,
    forceRenderKey,
    visualState,
    label,
    showToolbar,
    edgeId: toolbarEdgeId,
  } = useCustomEdge({
    edgeId: id,
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    style: props.style,
    markerEnd: props.markerEnd,
    selected: selected ?? false,
  });

  // View: 의미 단위로 그룹화하여 전달
  return (
    <CustomEdgeView
      // Geometry (Edge 형상 데이터)
      geometry={{
        edgeId: id,
        sourceX: props.sourceX,
        sourceY: props.sourceY,
        targetX: props.targetX,
        targetY: props.targetY,
        sourcePosition: props.sourcePosition,
        targetPosition: props.targetPosition,
      }}
      // Path data (Path 및 Label 위치)
      pathData={{
        edgePath: pathData.edgePath,
        labelX: pathData.labelX,
        labelY: pathData.labelY,
        forceRenderKey,
      }}
      // Visual (스타일 데이터)
      visual={{
        strokeColor: visualState.strokeColor,
        strokeWidth: visualState.strokeWidth,
        markerEnd: props.markerEnd,
        style: props.style,
      }}
      // Label (라벨 데이터)
      label={{
        label,
        isSelected: visualState.isSelected,
      }}
      // Toolbar (툴바 상태)
      toolbar={{
        showToolbar,
        edgeId: toolbarEdgeId,
      }}
    />
  );
});
