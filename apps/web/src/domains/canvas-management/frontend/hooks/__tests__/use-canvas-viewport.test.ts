import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasViewport } from '../use-canvas-viewport';

// React Flow Mock
const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();
const mockSetCenter = vi.fn();
const mockFitView = vi.fn();
const mockSetViewport = vi.fn();
const mockGetZoom = vi.fn(() => 1);
const mockGetViewport = vi.fn(() => ({ x: 0, y: 0, zoom: 1 }));

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    zoomIn: mockZoomIn,
    zoomOut: mockZoomOut,
    setCenter: mockSetCenter,
    fitView: mockFitView,
    setViewport: mockSetViewport,
    getZoom: mockGetZoom,
    getViewport: mockGetViewport,
  }),
}));

describe('useCanvasViewport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('zoomIn - 수동 제어', () => {
    it('React Flow의 zoomIn을 호출해야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasViewport());

      // When
      act(() => {
        result.current.zoomIn();
      });

      // Then
      expect(mockZoomIn).toHaveBeenCalledWith({ duration: 300 });
    });
  });

  describe('zoomOut - 수동 제어', () => {
    it('React Flow의 zoomOut을 호출해야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasViewport());

      // When
      act(() => {
        result.current.zoomOut();
      });

      // Then
      expect(mockZoomOut).toHaveBeenCalledWith({ duration: 300 });
    });
  });

  describe('panTo - 수동 제어', () => {
    it('React Flow의 setCenter를 호출해야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasViewport());
      const center = { x: 100, y: 200 };

      // When
      act(() => {
        result.current.panTo(center);
      });

      // Then
      expect(mockSetCenter).toHaveBeenCalledWith(center.x, center.y, {
        duration: 500,
        zoom: 1.0,
      });
    });
  });

  describe('fitToScreen - 수동 제어', () => {
    it('React Flow의 fitView를 호출해야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasViewport());

      // When
      act(() => {
        result.current.fitToScreen();
      });

      // Then
      expect(mockFitView).toHaveBeenCalledWith({ duration: 500, padding: 0.1 });
    });
  });

  describe('resetZoom - 수동 제어', () => {
    it('React Flow의 setViewport를 100% 줌으로 호출해야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasViewport());

      // When
      act(() => {
        result.current.resetZoom();
      });

      // Then
      expect(mockSetViewport).toHaveBeenCalled();
    });
  });

  describe('상태 읽기 메서드', () => {
    it('getZoomLevel은 현재 줌 레벨을 반환해야 한다', () => {
      // Given
      mockGetZoom.mockReturnValue(1.5);
      const { result } = renderHook(() => useCanvasViewport());

      // When
      const zoomLevel = result.current.getZoomLevel();

      // Then
      expect(zoomLevel).toBe(1.5);
    });

    it('getViewportCenter는 현재 뷰포트 중심을 반환해야 한다', () => {
      // Given
      mockGetViewport.mockReturnValue({ x: -100, y: -200, zoom: 1 });
      const { result } = renderHook(() => useCanvasViewport());

      // When
      const center = result.current.getViewportCenter();

      // Then
      expect(center.x).toBe(100); // -(-100) / 1
      expect(center.y).toBe(200); // -(-200) / 1
    });
  });
});

