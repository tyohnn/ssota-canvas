/**
 * useCreateEdge Hook 테스트
 *
 * 테스트 시나리오:
 * 1. 성공적인 엣지 생성 (Optimistic Update → Server Sync → Replace)
 * 2. Optimistic Update 검증
 * 3. 에러 발생 시 롤백
 * 4. 노드 존재 확인 검증
 * 5. 스키마 검증 실패 처리
 * 6. 서버 액션 실패 처리
 * 7. 로딩 상태 관리
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode, type ReactElement } from 'react';
import type { Edge, Node } from '@xyflow/react';

import { useCreateEdge } from '../use-create-edge';
import type {
  ReactFlowDependencies,
  CreateEdgeInput,
} from '../use-create-edge';
import type {
  EdgeData,
  EdgeShape,
} from '@/domains/canvas-management/shared/types/common.types';
import type { EdgeView } from '@/domains/canvas-management/shared/dtos/views';
import { isFailure } from '@/lib';

// Mock createEdgeAction
vi.mock('@/domains/canvas-management/actions/edge/create-edge.action', () => ({
  createEdgeAction: vi.fn(),
}));

import { createEdgeAction } from '@/domains/canvas-management/actions/edge/create-edge.action';

describe('useCreateEdge', () => {
  let queryClient: QueryClient;
  let mockGetEdges: ReactFlowDependencies['getEdges'];
  let mockSetEdges: ReactFlowDependencies['setEdges'];
  let mockGetNodes: ReactFlowDependencies['getNodes'];
  let reactFlow: ReactFlowDependencies;
  let wrapper: ({ children }: { children: ReactNode }) => ReactElement;
  let edges: Edge<EdgeData>[];
  let nodes: Node[];

  const pageId = '550e8400-e29b-41d4-a716-446655440000';
  const sourceBlockMountId = '111e8400-e29b-41d4-a716-446655440000';
  const targetBlockMountId = '222e8400-e29b-41d4-a716-446655440000';
  const sourceHandle = 'right' as const;
  const targetHandle = 'left' as const;

  const mockSourceNode: Node = {
    id: sourceBlockMountId,
    type: 'custom',
    position: { x: 0, y: 0 },
    data: {},
  };

  const mockTargetNode: Node = {
    id: targetBlockMountId,
    type: 'custom',
    position: { x: 100, y: 100 },
    data: {},
  };

  const mockEdgeView: EdgeView = {
    edgeId: '333e8400-e29b-41d4-a716-446655440000',
    pageId,
    sourceBlockMountId,
    targetBlockMountId,
    sourceHandle,
    targetHandle,
    edgeShape: 'default',
    markerEnd: 'arrow',
    markerStart: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // React Query 설정
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // React Flow Mock 설정
    edges = [];
    nodes = [mockSourceNode, mockTargetNode];

    mockGetEdges = vi.fn<() => Edge<EdgeData>[]>(() => [...edges]);
    mockSetEdges = vi.fn<
      (edges: Edge<EdgeData>[] | ((prev: Edge<EdgeData>[]) => Edge<EdgeData>[])) => void
    >((arg) => {
      edges = typeof arg === 'function' ? arg([...edges]) : [...arg];
    });
    mockGetNodes = vi.fn<() => Node[]>(() => [...nodes]);

    reactFlow = {
      getEdges: mockGetEdges,
      setEdges: mockSetEdges,
      getNodes: mockGetNodes,
    };

    // Mock 초기화
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('성공적인 엣지 생성', () => {
    it('엣지를 성공적으로 생성하고 optimistic update를 적용해야 한다', async () => {
      // Promise를 사용하여 타이밍 제어
      let resolveAction: (value: { success: true; data: EdgeView }) => void;
      const actionPromise = new Promise<{ success: true; data: EdgeView }>(
        resolve => {
          resolveAction = resolve;
        }
      );

      vi.mocked(createEdgeAction).mockReturnValue(actionPromise);

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const input: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      // 초기 상태 확인
      expect(result.current.isCreating).toBe(false);
      expect(mockGetEdges()).toHaveLength(0);

      // 엣지 생성 시작
      const createPromise = result.current.createEdge(input);

      // Optimistic update 확인 (서버 응답 전)
      await waitFor(() => {
        const currentEdges = mockGetEdges();
        expect(currentEdges).toHaveLength(1);
        const edge = currentEdges[0]!;
        expect(edge.id).toContain('optimistic-edge-');
        expect(edge.source).toBe(sourceBlockMountId);
        expect(edge.target).toBe(targetBlockMountId);
        expect(edge.sourceHandle).toBe(sourceHandle);
        expect(edge.targetHandle).toBe(targetHandle);
      });

      // 서버 응답 완료
      act(() => {
        resolveAction!({
          success: true,
          data: mockEdgeView,
        });
      });

      // 서버 응답 대기
      const edgeView = await createPromise;

      // 서버 응답 확인
      expect(edgeView).toEqual(mockEdgeView);
      expect(createEdgeAction).toHaveBeenCalledWith({
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      });

      // Optimistic edge가 실제 edge로 교체되었는지 확인
      await waitFor(() => {
        const currentEdges = mockGetEdges();
        expect(currentEdges).toHaveLength(1);
        const edge = currentEdges[0]!;
        expect(edge.id).toBe(mockEdgeView.edgeId);
        expect(edge.data?.edgeId).toBe(mockEdgeView.edgeId);
        expect(edge.data?.actualEdgeShape).toBe(mockEdgeView.edgeShape);
      });
    });

    it('로딩 상태가 올바르게 관리되어야 한다', async () => {
      let resolveAction: (value: { success: true; data: EdgeView } | { success: false; error: string }) => void;
      const actionPromise = new Promise<{ success: true; data: EdgeView } | { success: false; error: string }>(resolve => {
        resolveAction = resolve;
      });

      vi.mocked(createEdgeAction).mockReturnValue(
        actionPromise as Promise<{ success: true; data: EdgeView }>
      );

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const input: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      expect(result.current.isCreating).toBe(false);

      act(() => {
        result.current.createEdge(input);
      });

      // 로딩 상태 확인
      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      });

      // 서버 응답 완료
      act(() => {
        resolveAction!({
          success: true,
          data: mockEdgeView,
        });
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });
  });

  describe('Optimistic Update 검증', () => {
    it('optimistic edge가 즉시 React Flow Store에 추가되어야 한다', async () => {
      vi.mocked(createEdgeAction).mockResolvedValue({
        success: true,
        data: mockEdgeView,
      });

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const input: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      act(() => {
        result.current.createEdge(input);
      });

      // setEdges가 호출되었는지 확인 (함수형 업데이트: prev => [...prev, optimisticEdge])
      await waitFor(() => {
        expect(mockSetEdges).toHaveBeenCalled();
        const arg = vi.mocked(mockSetEdges).mock.calls[0]?.[0];
        expect(arg).toBeDefined();
        const newEdges =
          typeof arg === 'function' ? arg([]) : (arg as Edge<EdgeData>[]);
        expect(newEdges).toHaveLength(1);
        expect(newEdges[0]?.id).toContain('optimistic-edge-');
      });
    });

    it('optimistic edge의 데이터 구조가 올바르야 한다', async () => {
      vi.mocked(createEdgeAction).mockResolvedValue({
        success: true,
        data: mockEdgeView,
      });

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const input: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      act(() => {
        result.current.createEdge(input);
      });

      await waitFor(() => {
        const edges = mockGetEdges();
        const optimisticEdge = edges[0]!;
        expect(optimisticEdge).toMatchObject({
          source: sourceBlockMountId,
          target: targetBlockMountId,
          sourceHandle,
          targetHandle,
          type: 'custom',
          data: {
            pageId,
            actualEdgeShape: 'default',
          },
        });
        expect(optimisticEdge.data?.edgeId).toBeDefined();
      });
    });
  });

  describe('에러 처리 및 롤백', () => {
    it('서버 액션 실패 시 optimistic edge가 롤백되어야 한다', async () => {
      const initialEdges: Edge<EdgeData>[] = [];
      edges = initialEdges;

      // Promise를 사용하여 타이밍 제어
      let resolveAction: (value: { success: false; error: string; code: string }) => void;
      const actionPromise = new Promise<{ success: false; error: string; code: string }>(
        resolve => {
          resolveAction = resolve;
        }
      );

      vi.mocked(createEdgeAction).mockReturnValue(actionPromise);

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const input: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      const createPromise = result.current.createEdge(input);

      // Optimistic update 확인 (서버 응답 전)
      await waitFor(() => {
        expect(mockGetEdges()).toHaveLength(1);
      });

      // 서버 에러 발생 ({ success: false }를 반환하면 mutationFn에서 throw 발생)
      act(() => {
        resolveAction!({
          success: false,
          error: 'Server error',
          code: 'EDGE_CREATION_FAILED',
        });
      });

      // 에러 발생 후 롤백 확인
      await waitFor(() => {
        expect(mockGetEdges()).toHaveLength(0);
      });

      // createEdge는 null을 반환해야 함
      const edgeView = await createPromise;
      expect(edgeView).toBeNull();
    });

    it('노드가 없을 때 에러를 발생시켜야 한다', async () => {
      // 노드 제거
      nodes = [];
      // mockGetNodes를 재생성하여 새로운 nodes 배열을 참조하도록 함
      mockGetNodes = vi.fn<() => Node[]>(() => [...nodes]);
      reactFlow.getNodes = mockGetNodes;

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const input: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      act(() => {
        result.current.createEdge(input);
      });

      // 에러 발생 확인
      await waitFor(() => {
        expect(mockGetEdges()).toHaveLength(0);
      });

      // createEdge는 null을 반환해야 함
      const edgeView = await result.current.createEdge(input);
      expect(edgeView).toBeNull();
    });

    it('source 노드가 없을 때 에러를 발생시켜야 한다', async () => {
      // target 노드만 존재
      nodes = [mockTargetNode];
      mockGetNodes = vi.fn(() => [...nodes]);
      reactFlow.getNodes = mockGetNodes;

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const input: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      act(() => {
        result.current.createEdge(input);
      });

      await waitFor(() => {
        expect(mockGetEdges()).toHaveLength(0);
      });

      const edgeView = await result.current.createEdge(input);
      expect(edgeView).toBeNull();
    });

    it('target 노드가 없을 때 에러를 발생시켜야 한다', async () => {
      // source 노드만 존재
      nodes = [mockSourceNode];
      mockGetNodes = vi.fn(() => [...nodes]);
      reactFlow.getNodes = mockGetNodes;

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const input: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      act(() => {
        result.current.createEdge(input);
      });

      await waitFor(() => {
        expect(mockGetEdges()).toHaveLength(0);
      });

      const edgeView = await result.current.createEdge(input);
      expect(edgeView).toBeNull();
    });
  });

  describe('스키마 검증', () => {
    it('유효하지 않은 pageId로 인한 스키마 검증 실패를 처리해야 한다', async () => {
      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const invalidInput: CreateEdgeInput = {
        sourceBlockMountId: 'invalid-uuid',
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      act(() => {
        result.current.createEdge(invalidInput);
      });

      // 스키마 검증 실패로 인해 createEdgeAction이 호출되지 않아야 함
      await waitFor(() => {
        expect(createEdgeAction).not.toHaveBeenCalled();
      });

      const edgeView = await result.current.createEdge(invalidInput);
      expect(edgeView).toBeNull();
    });

    it('유효하지 않은 handle로 인한 스키마 검증 실패를 처리해야 한다', async () => {
      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const invalidInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle: 'invalid-handle' as any,
        targetHandle,
      };

      act(() => {
        result.current.createEdge(invalidInput);
      });

      await waitFor(() => {
        expect(createEdgeAction).not.toHaveBeenCalled();
      });

      const edgeView = await result.current.createEdge(invalidInput);
      expect(edgeView).toBeNull();
    });
  });

  describe('엣지 교체 로직', () => {
    it('서버 응답 후 optimistic edge를 실제 edge로 교체해야 한다', async () => {
      // Promise를 사용하여 타이밍 제어
      let resolveAction: (value: { success: true; data: EdgeView }) => void;
      const actionPromise = new Promise<{ success: true; data: EdgeView }>(
        resolve => {
          resolveAction = resolve;
        }
      );

      vi.mocked(createEdgeAction).mockReturnValue(actionPromise);

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const input: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      result.current.createEdge(input);

      // Optimistic edge 확인 (서버 응답 전)
      await waitFor(() => {
        const edges = mockGetEdges();
        expect(edges[0]!.id).toContain('optimistic-edge-');
      });

      // 서버 응답 완료
      act(() => {
        resolveAction!({
          success: true,
          data: mockEdgeView,
        });
      });

      // 실제 edge로 교체 확인
      await waitFor(() => {
        const edges = mockGetEdges();
        expect(edges).toHaveLength(1);
        const edge = edges[0]!;
        expect(edge.id).toBe(mockEdgeView.edgeId);
        expect(edge.data?.edgeId).toBe(mockEdgeView.edgeId);
        expect(edge.data?.actualEdgeShape).toBe(mockEdgeView.edgeShape);
        expect(edge.data?.createdAt).toBe(mockEdgeView.createdAt);
        expect(edge.data?.updatedAt).toBe(mockEdgeView.updatedAt);
      });
    });

    it('기존 엣지가 있을 때도 올바르게 교체해야 한다', async () => {
      const existingEdge: Edge<EdgeData> = {
        id: 'existing-edge-1',
        source: 'other-source',
        target: 'other-target',
        type: 'custom',
        data: {
          edgeId: 'existing-edge-1',
          actualEdgeShape: 'default',
          pageId,
        },
      };

      edges = [existingEdge];
      mockSetEdges([existingEdge]);

      vi.mocked(createEdgeAction).mockResolvedValue({
        success: true,
        data: mockEdgeView,
      });

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const input: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      act(() => {
        result.current.createEdge(input);
      });

      // 기존 엣지와 새로운 optimistic edge가 모두 있어야 함
      await waitFor(() => {
        const edges = mockGetEdges();
        expect(edges).toHaveLength(2);
      });

      // 실제 edge로 교체 후 기존 엣지는 유지되어야 함
      await waitFor(() => {
        const edges = mockGetEdges();
        expect(edges).toHaveLength(2);
        const newEdge = edges.find((e: Edge<EdgeData>) => e.id === mockEdgeView.edgeId);
        const oldEdge = edges.find((e: Edge<EdgeData>) => e.id === 'existing-edge-1');
        expect(newEdge).toBeDefined();
        expect(oldEdge).toBeDefined();
      });
    });
  });

  describe('다중 엣지 생성', () => {
    it('여러 엣지를 순차적으로 생성할 수 있어야 한다', async () => {
      const secondTargetNode: Node = {
        id: '333e8400-e29b-41d4-a716-446655440000',
        type: 'custom',
        position: { x: 200, y: 200 },
        data: {},
      };

      nodes = [mockSourceNode, mockTargetNode, secondTargetNode];
      mockGetNodes = vi.fn(() => [...nodes]);
      reactFlow.getNodes = mockGetNodes;

      const secondEdgeView: EdgeView = {
        ...mockEdgeView,
        edgeId: '444e8400-e29b-41d4-a716-446655440000',
        targetBlockMountId: secondTargetNode.id,
      };

      vi.mocked(createEdgeAction)
        .mockResolvedValueOnce({
          success: true,
          data: mockEdgeView,
        })
        .mockResolvedValueOnce({
          success: true,
          data: secondEdgeView,
        });

      const { result } = renderHook(
        () => useCreateEdge({ pageId, reactFlow }),
        { wrapper }
      );

      const firstInput: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
      };

      const secondInput: CreateEdgeInput = {
        sourceBlockMountId,
        targetBlockMountId: secondTargetNode.id,
        sourceHandle,
        targetHandle,
      };

      // 첫 번째 엣지 생성
      act(() => {
        result.current.createEdge(firstInput);
      });

      await waitFor(() => {
        expect(mockGetEdges()).toHaveLength(1);
      });

      // 두 번째 엣지 생성
      act(() => {
        result.current.createEdge(secondInput);
      });

      await waitFor(() => {
        expect(mockGetEdges()).toHaveLength(2);
      });

      // 두 엣지 모두 실제 edge로 교체되었는지 확인
      await waitFor(() => {
        const edges = mockGetEdges();
        expect(edges).toHaveLength(2);
        expect(edges.some((e: Edge<EdgeData>) => e.id === mockEdgeView.edgeId)).toBe(true);
        expect(edges.some((e: Edge<EdgeData>) => e.id === secondEdgeView.edgeId)).toBe(true);
      });
    });
  });
});
