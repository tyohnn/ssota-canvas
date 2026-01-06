'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  CanvasMetadata,
  useCanvasMetadata,
} from '../contexts/canvas-metadata-context';
import { useCanvasState } from './control/use-canvas-state';
import { useCanvasViewportStorage } from './control/use-canvas-viewport-storage';

export interface UseCanvasViewportParams {
  pageId: string;
  canvasMetadataOverride?: CanvasMetadata;
}

export interface UseCanvasViewportResult {
  // 상태 읽기
  getZoomLevel: () => number;
  getViewportCenter: () => { x: number; y: number };
  getViewportBounds: () => {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  getViewport: () => { x: number; y: number; zoom: number };
  reactFlow: any;

  // 수동 제어
  zoomIn: () => void;
  zoomOut: () => void;
  panTo: (center: { x: number; y: number }) => void;
  fitToScreen: () => void;
  resetZoom: () => void;
  setViewport: (
    x: number,
    y: number,
    zoom: number,
    options?: { duration?: number }
  ) => void;
  restoreViewport: (viewportState: {
    x: number;
    y: number;
    zoom: number;
  }) => void;

  // 스토리지 연동
  getViewportStateFromStorage: () => {
    x: number;
    y: number;
    zoom: number;
    lastUpdated: string;
  } | null;
  setViewportStateToStorage: (viewportState: {
    x: number;
    y: number;
    zoom: number;
  }) => void;
  getSelectedBlocksFromStorage: () => string[];
  setSelectedBlocksToStorage: (blockIds: string[]) => void;
  getSnapSettingsFromStorage: () => {
    enabled: boolean;
    threshold: number;
    showGuidelines: boolean;
  };
  setSnapSettingsToStorage: (settings: {
    enabled: boolean;
    threshold: number;
    showGuidelines: boolean;
  }) => void;
  clearCanvasStorageForPage: () => void;

  // Viewport 생명주기 관리 (내부적으로 완전히 관리)
  defaultViewport: { x: number; y: number; zoom: number };
  handleViewportChange: (viewport: {
    x: number;
    y: number;
    zoom: number;
  }) => void;
  flushViewportSave: () => void; // 즉시 저장 (debounce flush)
}

/**
 * Canvas Viewport 생명주기 관리 Hook (Facade Pattern)
 *
 * - 개별 viewport 훅들을 통합하여 단일 API 제공
 * - React Flow 뷰포트 상태 관리
 * - 로컬 스토리지 연동
 * - 페이지별 뷰포트 상태 저장/복원
 */
export function useCanvasViewport(
  params: UseCanvasViewportParams
): UseCanvasViewportResult {
  const canvasMetadata = useCanvasMetadata(params.canvasMetadataOverride);
  const { pageId } = params;

  // ============================================================================
  // 도메인 훅 사용
  // ============================================================================

  // Canvas State 훅 (React Flow 뷰포트 상태 읽기/제어)
  const canvasState = useCanvasState();

  // Canvas Viewport Storage 훅 (로컬 스토리지 관리)
  const viewportStorage = useCanvasViewportStorage();

  // ============================================================================
  // Viewport 생명주기 관리 (내부적으로 완전히 관리)
  // ============================================================================

  // 페이지별 초기 viewport 로드 여부 추적
  const lastLoadedPageIdRef = useRef<string | null>(null);

  // 초기 viewport 설정 (깜빡임 방지)
  const defaultViewport = useMemo((): {
    x: number;
    y: number;
    zoom: number;
  } => {
    const savedViewport = viewportStorage.getViewportState(pageId);
    if (savedViewport) {
      return {
        x: savedViewport.x,
        y: savedViewport.y,
        zoom: savedViewport.zoom,
      };
    }
    // 저장된 viewport가 없으면 기본값 (fitView는 나중에 실행)
    return { x: 0, y: 0, zoom: 1 };
  }, [viewportStorage, pageId]);

  // 페이지 변경 시 viewport 복원 또는 fitView (내부적으로 useEffect로 관리)
  useEffect(() => {
    // 이미 로드된 페이지면 스킵
    if (lastLoadedPageIdRef.current === pageId) {
      return;
    }

    // React Flow가 준비될 때까지 대기
    const timer = setTimeout(() => {
      const savedViewport = viewportStorage.getViewportState(pageId);

      if (savedViewport) {
        // 저장된 viewport가 있으면 애니메이션과 함께 복원
        canvasState.setViewport(
          savedViewport.x,
          savedViewport.y,
          savedViewport.zoom,
          { duration: 400 }
        );
      } else {
        // 저장된 viewport가 없으면 fitView 실행 (애니메이션 포함)
        canvasState.fitToScreen();
      }

      // 로드 완료 표시
      lastLoadedPageIdRef.current = pageId;
    }, 100); // React Flow 초기화 대기

    return () => clearTimeout(timer);
  }, [pageId, canvasState, viewportStorage]);

  // Viewport 변경 시 자동 저장 (debounced, 내부적으로 관리)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastViewportRef = useRef<{ x: number; y: number; zoom: number } | null>(
    null
  );

  const handleViewportChange = useCallback(
    (viewport: { x: number; y: number; zoom: number }) => {
      // 현재 viewport 추적 (즉시 저장용)
      lastViewportRef.current = viewport;

      // 기존 타이머 취소
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 500ms 후에 저장
      debounceTimerRef.current = setTimeout(() => {
        viewportStorage.setViewportState(pageId, viewport);
      }, 500);
    },
    [viewportStorage, pageId]
  );

  // 즉시 저장 함수 (debounce flush)
  const flushViewportSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (lastViewportRef.current) {
      viewportStorage.setViewportState(pageId, lastViewportRef.current);
    }
  }, [viewportStorage, pageId]);

  // 컴포넌트 언마운트 시 타이머 정리 및 마지막 viewport 저장
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      // 언마운트 시 마지막 viewport 즉시 저장
      if (lastViewportRef.current) {
        viewportStorage.setViewportState(pageId, lastViewportRef.current);
      }
    };
  }, [viewportStorage, pageId]);

  // ============================================================================
  // 스토리지 연동 래퍼 함수
  // ============================================================================

  const getViewportStateFromStorage = useCallback(() => {
    return viewportStorage.getViewportState(pageId);
  }, [viewportStorage, pageId]);

  const setViewportStateToStorage = useCallback(
    (viewportState: { x: number; y: number; zoom: number }) => {
      viewportStorage.setViewportState(pageId, viewportState);
    },
    [viewportStorage, pageId]
  );

  const getSelectedBlocksFromStorage = useCallback(() => {
    return viewportStorage.getSelectedBlocks();
  }, [viewportStorage]);

  const setSelectedBlocksToStorage = useCallback(
    (blockIds: string[]) => {
      viewportStorage.setSelectedBlocks(blockIds);
    },
    [viewportStorage]
  );

  const getSnapSettingsFromStorage = useCallback(() => {
    return viewportStorage.getSnapSettings();
  }, [viewportStorage]);

  const setSnapSettingsToStorage = useCallback(
    (settings: {
      enabled: boolean;
      threshold: number;
      showGuidelines: boolean;
    }) => {
      viewportStorage.setSnapSettings(settings);
    },
    [viewportStorage]
  );

  const clearCanvasStorageForPage = useCallback(() => {
    viewportStorage.clearCanvasStorageForPage(pageId);
  }, [viewportStorage, pageId]);

  return {
    // 상태 읽기
    getZoomLevel: canvasState.getZoomLevel,
    getViewportCenter: canvasState.getViewportCenter,
    getViewportBounds: canvasState.getViewportBounds,
    getViewport: canvasState.getViewport,
    reactFlow: canvasState.reactFlow,

    // 수동 제어
    zoomIn: canvasState.zoomIn,
    zoomOut: canvasState.zoomOut,
    panTo: canvasState.panTo,
    fitToScreen: canvasState.fitToScreen,
    resetZoom: canvasState.resetZoom,
    setViewport: canvasState.setViewport,
    restoreViewport: canvasState.restoreViewport,

    // 스토리지 연동
    getViewportStateFromStorage,
    setViewportStateToStorage,
    getSelectedBlocksFromStorage,
    setSelectedBlocksToStorage,
    getSnapSettingsFromStorage,
    setSnapSettingsToStorage,
    clearCanvasStorageForPage,

    // Viewport 생명주기 관리 (내부적으로 완전히 관리)
    defaultViewport,
    handleViewportChange,
    flushViewportSave, // 즉시 저장 (debounce flush)
  };
}
