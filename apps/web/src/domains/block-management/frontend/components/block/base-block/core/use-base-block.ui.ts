/**
 * Base Block UI State Hook
 *
 * UI 상태만 관리 (비즈니스 로직 없음)
 * - 리사이즈 상태
 * - Hover 상태
 * - Edge handle hover direction
 *
 * 노코드 툴에서 독립적으로 사용 가능
 */

'use client';

import { useState, useCallback } from 'react';
import type { HoverDirection } from './types';

export interface BaseBlockUIState {
  // UI 상태
  isResizing: boolean;
  hoverDirection: HoverDirection;

  // UI 액션
  setIsResizing: (isResizing: boolean) => void;
  handleResizeStart: () => void;
  handleResizeComplete: () => void;
  setHoverDirection: (direction: HoverDirection) => void;
  detectEdgeHoverDirection: (event: React.MouseEvent<HTMLDivElement>) => void;
  clearHoverDirection: () => void;
}

/**
 * BaseBlock UI State Hook
 *
 * 로컬 UI 상태만 관리 (API 호출 없음)
 */
export function useBaseBlockUI(): BaseBlockUIState {
  const [isResizing, setIsResizing] = useState(false);
  const [hoverDirection, setHoverDirection] = useState<HoverDirection>(null);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeComplete = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Mouse Move: Detect edge hover
  const detectEdgeHoverDirection = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 경계 감지 영역 (20px)
      const edgeThreshold = 20;

      // 어느 경계에 가까운지 확인
      let newDirection: HoverDirection = null;
      if (x < edgeThreshold) {
        newDirection = 'left';
      } else if (x > rect.width - edgeThreshold) {
        newDirection = 'right';
      } else if (y < edgeThreshold) {
        newDirection = 'top';
      } else if (y > rect.height - edgeThreshold) {
        newDirection = 'bottom';
      }

      // 상태가 변경될 때만 업데이트
      if (newDirection !== hoverDirection) {
        setHoverDirection(newDirection);
      }
    },
    [hoverDirection]
  );

  // Mouse Leave: Clear hover direction
  const clearHoverDirection = useCallback(() => {
    setHoverDirection(null);
  }, [hoverDirection]);

  return {
    isResizing,
    hoverDirection,
    setIsResizing,
    handleResizeStart,
    handleResizeComplete,
    setHoverDirection,
    detectEdgeHoverDirection,
    clearHoverDirection,
  };
}
