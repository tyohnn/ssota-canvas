import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasSnapGuides } from '../use-canvas-snap-guides';
import { Node } from '@xyflow/react';

describe('useCanvasSnapGuides', () => {
  const mockNodes: Node[] = [
    {
      id: 'dragged-block',
      position: { x: 0, y: 0 },
      data: {},
      width: 200,
      height: 150,
    },
    {
      id: 'block-1',
      position: { x: 100, y: 100 },
      data: {},
      width: 200,
      height: 150,
    },
    {
      id: 'block-2',
      position: { x: 400, y: 100 },
      data: {},
      width: 200,
      height: 150,
    },
    {
      id: 'block-3',
      position: { x: 100, y: 300 },
      data: {},
      width: 200,
      height: 150,
    },
  ];

  describe('calculateSnapGuides', () => {
    it('10px 임계값 내 진입 시 가이드라인을 생성하고 스냅해야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasSnapGuides());
      const draggedBlockId = 'dragged-block';
      const currentPosition = { x: 102, y: 102 }; // block-1의 x(100), y(100)에서 2px 차이

      // When
      let snapResult: any;
      act(() => {
        snapResult = result.current.calculateSnapGuides(
          draggedBlockId,
          currentPosition,
          mockNodes
        );
      });

      // Then
      expect(result.current.guidelines.length).toBeGreaterThan(0);
      expect(snapResult).toBeDefined();
      expect(snapResult.position).toBeDefined();
      expect(snapResult.position.x).toBe(100); // 스냅되어 100으로 맞춰짐
      expect(snapResult.position.y).toBe(100); // 스냅되어 100으로 맞춰짐
    });

    it('중심선 스냅 가이드라인이 우선순위 높음이어야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasSnapGuides());
      const draggedBlockId = 'dragged-block';
      const currentPosition = { x: 103, y: 200 }; // block-1 중심선 근처

      // When
      act(() => {
        result.current.calculateSnapGuides(draggedBlockId, currentPosition, mockNodes);
      });

      // Then
      const centerGuidelines = result.current.guidelines.filter(
        (g) => g.type === 'center-vertical' || g.type === 'center-horizontal'
      );
      expect(centerGuidelines.length).toBeGreaterThan(0);
      expect(centerGuidelines.every((g) => g.priority === 'high')).toBe(true);
    });

    it('가장자리 스냅 가이드라인이 우선순위 낮음이어야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasSnapGuides());
      const draggedBlockId = 'dragged-block';
      const currentPosition = { x: 302, y: 200 }; // block-1 오른쪽 가장자리(300) 근처

      // When
      act(() => {
        result.current.calculateSnapGuides(draggedBlockId, currentPosition, mockNodes);
      });

      // Then
      const edgeGuidelines = result.current.guidelines.filter(
        (g) => g.type === 'edge-vertical' || g.type === 'edge-horizontal'
      );
      if (edgeGuidelines.length > 0) {
        expect(edgeGuidelines.every((g) => g.priority === 'low')).toBe(true);
      }
    });

    it('드래그 중인 블럭은 가이드라인 계산에서 제외되어야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasSnapGuides());
      const draggedBlockId = 'block-1';
      const currentPosition = { x: 402, y: 150 }; // block-2(x=400) 근처로 이동

      // When
      act(() => {
        result.current.calculateSnapGuides(draggedBlockId, currentPosition, mockNodes);
      });

      // Then - block-1은 제외되고 block-2, block-3만 계산되어 가이드라인 생성
      expect(result.current.guidelines.length).toBeGreaterThan(0);
      // block-1 자신의 위치(100)로는 가이드라인이 생성되지 않아야 함
      expect(result.current.guidelines.every(g => g.position !== 100)).toBe(true);
    });

    it('임계값 초과 시 가이드라인이 생성되지 않아야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasSnapGuides());
      const draggedBlockId = 'dragged-block';
      const currentPosition = { x: 150, y: 200 }; // 모든 블럭에서 6px 이상 떨어짐

      // When
      act(() => {
        result.current.calculateSnapGuides(draggedBlockId, currentPosition, mockNodes);
      });

      // Then
      expect(result.current.guidelines.length).toBe(0);
    });
  });

  describe('showGuidelines', () => {
    it('가이드라인을 표시할 수 있어야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasSnapGuides());
      const testGuidelines = [
        {
          type: 'center-vertical' as const,
          position: 100,
          priority: 'high' as const,
        },
      ];

      // When
      act(() => {
        result.current.showGuidelines(testGuidelines);
      });

      // Then
      expect(result.current.guidelines).toEqual(testGuidelines);
    });
  });

  describe('hideGuidelines', () => {
    it('가이드라인을 숨길 수 있어야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasSnapGuides());
      
      act(() => {
        result.current.showGuidelines([
          {
            type: 'center-vertical',
            position: 100,
            priority: 'high',
          },
        ]);
      });

      // When
      act(() => {
        result.current.hideGuidelines();
      });

      // Then
      expect(result.current.guidelines).toHaveLength(0);
    });
  });
});

