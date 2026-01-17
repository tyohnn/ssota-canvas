import { useCallback, useRef, useState } from 'react';

import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/control/use-prevent-pinch-zoom';

import type { ViewportDependencies } from './types';

/**
 * UI State Hook for Viewport Controls
 *
 * 디자이너가 Storybook/노코드 툴에서 사용할 수 있는 순수 UI 로직
 * - 비즈니스 로직 없음 (API 호출, 데이터 검증 등)
 * - UI 상태 관리만 담당
 * - 노코드 환경에서 독립적으로 테스트 가능
 */
export interface ViewportControlToolbarUIState {
  showMiniMap: boolean;
  zoomLevel: number;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  minimapRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  toggleMiniMap: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleFitToScreen: () => void;
}

export function useViewportControlToolbarUI(
  viewportDependencies: ViewportDependencies
): ViewportControlToolbarUIState {
  const [showMiniMap, setShowMiniMap] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent pinch zoom on toolbar elements (Side effect handled in UI hook)
  usePreventPinchZoom(toolbarRef);
  usePreventPinchZoom(minimapRef);
  usePreventPinchZoom(containerRef);

  // 미니맵 토글
  const toggleMiniMap = useCallback(() => {
    setShowMiniMap(prev => !prev);
  }, []);

  // 핸들러들 (dependency를 사용하여 생성)
  const handleZoomIn = useCallback(() => {
    viewportDependencies.zoomIn();
  }, [viewportDependencies]);

  const handleZoomOut = useCallback(() => {
    viewportDependencies.zoomOut();
  }, [viewportDependencies]);

  const handleFitToScreen = useCallback(() => {
    viewportDependencies.fitToScreen();
  }, [viewportDependencies]);

  // Use reactive zoomLevel directly from viewportDependencies
  const zoomLevel = viewportDependencies.zoomLevel;

  return {
    showMiniMap,
    zoomLevel,
    toolbarRef,
    minimapRef,
    containerRef,
    toggleMiniMap,
    handleZoomIn,
    handleZoomOut,
    handleFitToScreen,
  };
}
