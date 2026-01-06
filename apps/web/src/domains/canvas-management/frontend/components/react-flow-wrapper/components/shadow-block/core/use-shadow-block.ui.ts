import { useState } from 'react';

import type { MouseState, ShadowBlockUIState } from './types';

/**
 * UI Hook for Shadow Block
 *
 * 마우스 상태 관리만 담당 (이벤트 리스너 등록 없음)
 * 이벤트 리스너 등록은 오케스트레이션 레이어에서 처리
 */
export function useShadowBlockUI(): ShadowBlockUIState {
  const [mouseState, setMouseState] = useState<MouseState>({
    position: null,
    isInitialized: false,
  });

  return {
    mouseState,
    setMousePosition: pos =>
      setMouseState(prev => ({ ...prev, position: pos })),
    setIsInitialized: initialized =>
      setMouseState(prev => ({ ...prev, isInitialized: initialized })),
    resetMouseState: () =>
      setMouseState({ position: null, isInitialized: false }),
  };
}
