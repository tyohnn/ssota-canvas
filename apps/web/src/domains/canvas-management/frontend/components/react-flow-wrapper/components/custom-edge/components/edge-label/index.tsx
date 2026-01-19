/**
 * Edge Label Component
 *
 * Container component that provides edge label editing functionality.
 * All business logic and side effects are handled in the hook.
 *
 * Features:
 * - Label display (read mode)
 * - Label editing (click to edit, Enter/Escape to save/cancel)
 * - Optimistic updates with automatic rollback
 */

'use client';

import React, { memo } from 'react';

import { EdgeLabelView } from './components';
import type { EdgeLabelProps } from './core/types';
import { useEdgeLabel } from './core/use-edge-label';

/**
 * Edge Label Container Component
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
export const EdgeLabel = memo(function EdgeLabel(
  props: EdgeLabelProps
): React.JSX.Element {
  // Container (Thin): 훅에 필요한 것만 추출
  const { edgeId, label, canvasMetadata, businessLogic, readonly = false } = props;

  // Hook: 비즈니스 로직 처리
  const {
    labelState,
    inputRef,
    handleLabelClick,
    handleLabelBlur,
    handleLabelChange,
    handleLabelKeyDown,
  } = useEdgeLabel(
    {
      edgeId,
      label,
      canvasMetadata, // 테스트용으로만 전달
    },
    businessLogic
  );

  return (
    <EdgeLabelView
      label={labelState.label}
      isEditing={labelState.isEditing}
      draftLabel={labelState.draftLabel}
      x={props.position.x}
      y={props.position.y}
      onClick={readonly ? undefined : handleLabelClick}
      onBlur={handleLabelBlur}
      onChange={handleLabelChange}
      onKeyDown={handleLabelKeyDown}
      isSelected={props.isSelected}
      inputRef={inputRef}
      readonly={readonly}
    />
  );
});
