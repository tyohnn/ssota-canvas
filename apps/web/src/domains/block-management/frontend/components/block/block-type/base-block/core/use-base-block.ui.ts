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

export type HoverDirection = 'left' | 'right' | 'top' | 'bottom' | null;

export interface BaseBlockUIState {
  // UI 상태
  isResizing: boolean;
  hoverDirection: HoverDirection;

  // UI 액션
  setIsResizing: (isResizing: boolean) => void;
  handleResizeStart: () => void;
  handleResizeComplete: () => void;
  setHoverDirection: (direction: HoverDirection) => void;
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

  return {
    isResizing,
    hoverDirection,
    setIsResizing,
    handleResizeStart,
    handleResizeComplete,
    setHoverDirection,
  };
}
