import { memo } from 'react';

import { Box } from '@/components/ui/box';

import type { BoundingBoxBounds } from '../core/types';

/**
 * Bounding Box View Props
 *
 * Presentational component that renders the bounding box visual.
 * All logic is handled by the parent Container component.
 */
export interface BoundingBoxViewProps {
  /**
   * Bounding box bounds in screen coordinates
   */
  bounds: BoundingBoxBounds;

  /**
   * Reference to the bounding box DOM element
   */
  boundingBoxRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Handler for mouse down event (starts dragging)
   */
  onMouseDown: (e: React.PointerEvent) => void;
}

/**
 * Bounding Box View Component
 *
 * Pure presentational component that renders the bounding box.
 * All business logic and state management is handled by the parent Container.
 *
 * This component is designed to be testable in Storybook with simple props.
 */
export const BoundingBoxView = memo(function BoundingBoxView({
  bounds,
  boundingBoxRef,
  onMouseDown,
}: BoundingBoxViewProps) {
  return (
    <Box
      ref={boundingBoxRef}
      className="absolute cursor-move select-none"
      onPointerDown={onMouseDown}
      onWheel={e => e.stopPropagation()}
      style={{
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        border: '2px solid rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '4px',
        zIndex: 100, // 노드보다 위에 렌더링
        willChange: 'transform', // 성능 최적화
        pointerEvents: 'auto', // 드래그 가능하게
        touchAction: 'none', // 터치 이벤트 차단 (핀치 줌 방지)
      }}
    />
  );
});
