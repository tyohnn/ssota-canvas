/**
 * Animated Viewport Hook
 *
 * viewport 전환을 블록 애니메이션과 동기화
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface UseAnimatedViewportParams {
  viewport: { x: number; y: number; zoom: number };
  startDelay: number; // 블록 애니메이션 시작 시점과 동일하게
  enabled?: boolean;
}

// 초기 기본 viewport (애니메이션 전 상태)
const DEFAULT_INITIAL_VIEWPORT = { x: 0, y: 0, zoom: 1 };

export function useAnimatedViewport({
  viewport,
  startDelay,
  enabled = true,
}: UseAnimatedViewportParams) {
  const [currentViewport, setCurrentViewport] = useState(
    DEFAULT_INITIAL_VIEWPORT
  );

  useEffect(() => {
    if (!enabled) {
      // 애니메이션 비활성화 시 즉시 적용
      setCurrentViewport(viewport);
      return;
    }

    // startDelay 후에 viewport 변경
    const timer = setTimeout(() => {
      setCurrentViewport(viewport);
    }, startDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [viewport, startDelay, enabled]);

  return currentViewport;
}
