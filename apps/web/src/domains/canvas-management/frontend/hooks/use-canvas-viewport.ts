'use client';

import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';

export function useCanvasViewport() {
  // React Flow 인스턴스 사용 (안전하게 처리)
  // Hook은 항상 호출해야 함 (Hook Rules)
  const reactFlow = useReactFlow();

  // 상태 읽기 메서드들 (읽기 전용) - 안전성 체크 추가
  const getZoomLevel = useCallback(() => {
    if (!reactFlow) return 1;
    try {
      return reactFlow.getZoom();
    } catch {
      return 1;
    }
  }, [reactFlow]);

  const getViewportCenter = useCallback(() => {
    if (!reactFlow) return { x: 0, y: 0 };
    try {
      const viewport = reactFlow.getViewport();
      return {
        x: -viewport.x / viewport.zoom,
        y: -viewport.y / viewport.zoom,
      };
    } catch {
      return { x: 0, y: 0 };
    }
  }, [reactFlow]);

  const getViewportBounds = useCallback(() => {
    if (!reactFlow) {
      return {
        x: 0,
        y: 0,
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
      };
    }
    try {
      const viewport = reactFlow.getViewport();
      // React Flow의 화면 경계 계산
      return {
        x: -viewport.x / viewport.zoom,
        y: -viewport.y / viewport.zoom,
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
      };
    } catch {
      return {
        x: 0,
        y: 0,
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
      };
    }
  }, [reactFlow]);

  // 뷰포트 객체 직접 가져오기
  const getViewport = useCallback(() => {
    if (!reactFlow) return { x: 0, y: 0, zoom: 1 };
    try {
      return reactFlow.getViewport();
    } catch {
      return { x: 0, y: 0, zoom: 1 };
    }
  }, [reactFlow]);

  /**
   * 수동 제어 메서드들 (AI Tool Call, 프로그램적 제어용)
   */
  const zoomIn = useCallback(() => {
    if (!reactFlow) return;
    try {
      reactFlow.zoomIn({ duration: 300 });
    } catch (error) {
      console.error('Failed to zoom in:', error);
    }
  }, [reactFlow]);

  const zoomOut = useCallback(() => {
    if (!reactFlow) return;
    try {
      reactFlow.zoomOut({ duration: 300 });
    } catch (error) {
      console.error('Failed to zoom out:', error);
    }
  }, [reactFlow]);

  const panTo = useCallback(
    (center: { x: number; y: number }) => {
      if (!reactFlow) return;
      try {
        reactFlow.setCenter(center.x, center.y, { duration: 500, zoom: 1.0 });
      } catch (error) {
        console.error('Failed to pan to center:', error);
      }
    },
    [reactFlow]
  );

  const fitToScreen = useCallback(() => {
    if (!reactFlow) return;
    try {
      reactFlow.fitView({ duration: 500, padding: 0.1 });
    } catch (error) {
      console.error('Failed to fit to screen:', error);
    }
  }, [reactFlow]);

  const resetZoom = useCallback(() => {
    if (!reactFlow) return;
    try {
      const viewport = reactFlow.getViewport();
      reactFlow.setViewport(
        { x: viewport.x, y: viewport.y, zoom: 1 },
        { duration: 300 }
      );
    } catch (error) {
      console.error('Failed to reset zoom:', error);
    }
  }, [reactFlow]);

  return {
    // 상태 읽기
    getZoomLevel,
    getViewportCenter,
    getViewportBounds,
    getViewport,
    reactFlow: reactFlow || null,
    // 수동 제어
    zoomIn,
    zoomOut,
    panTo,
    fitToScreen,
    resetZoom,
  };
}
