import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBlockStateUpdate } from '../use-block-state-update';

// Mock React Flow
const mockGetNode = vi.fn();
const mockUpdateNode = vi.fn();
const mockSetNodes = vi.fn();

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    getNode: mockGetNode,
    updateNode: mockUpdateNode,
    setNodes: mockSetNodes,
  }),
}));

describe('useBlockStateUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateBlockRenderState', () => {
    it('완성된 블록의 상태를 올바르게 업데이트해야 한다', () => {
      // Given
      const blockId = 'block-1';
      const blockType = 'basic';
      const properties = {
        title: 'Test Title',
        content: 'Test Content'
      };

      const mockNode = {
        id: blockId,
        data: {
          blockType,
          properties: {},
          state: 'skeleton'
        }
      };

      mockGetNode.mockReturnValue(mockNode);

      const { result } = renderHook(() => useBlockStateUpdate());

      // When
      result.current.updateBlockRenderState(blockId, blockType, properties);

      // Then
      expect(mockUpdateNode).toHaveBeenCalledWith(blockId, {
        data: {
          ...mockNode.data,
          state: 'completed',
          isSkeleton: false,
          isCompleted: true,
          properties,
        },
      });
    });

    it('스켈레톤 블록의 상태를 올바르게 업데이트해야 한다', () => {
      // Given
      const blockId = 'block-1';
      const blockType = 'basic';
      const properties = {
        title: '',
        content: ''
      };

      const mockNode = {
        id: blockId,
        data: {
          blockType,
          properties: {},
          state: 'completed'
        }
      };

      mockGetNode.mockReturnValue(mockNode);

      const { result } = renderHook(() => useBlockStateUpdate());

      // When
      result.current.updateBlockRenderState(blockId, blockType, properties);

      // Then
      expect(mockUpdateNode).toHaveBeenCalledWith(blockId, {
        data: {
          ...mockNode.data,
          state: 'skeleton',
          isSkeleton: true,
          isCompleted: false,
          properties,
        },
      });
    });

    it('존재하지 않는 블록에 대해 아무것도 하지 않아야 한다', () => {
      // Given
      const blockId = 'non-existent';
      mockGetNode.mockReturnValue(null);

      const { result } = renderHook(() => useBlockStateUpdate());

      // When
      result.current.updateBlockRenderState(blockId, 'basic', {});

      // Then
      expect(mockUpdateNode).not.toHaveBeenCalled();
    });
  });

  describe('updateBlockProperties', () => {
    it('블록 속성을 업데이트하고 상태를 재계산해야 한다', () => {
      // Given
      const blockId = 'block-1';
      const blockType = 'basic';
      const existingProperties = { title: '' };
      const newProperties = { content: 'Test Content' };

      const mockNode = {
        id: blockId,
        data: {
          blockType,
          properties: existingProperties,
          state: 'skeleton'
        }
      };

      mockGetNode.mockReturnValue(mockNode);

      const { result } = renderHook(() => useBlockStateUpdate());

      // When
      result.current.updateBlockProperties(blockId, newProperties);

      // Then
      expect(mockUpdateNode).toHaveBeenCalledWith(blockId, {
        data: {
          ...mockNode.data,
          state: 'skeleton', // title이 비어있어서 여전히 스켈레톤
          isSkeleton: true,
          isCompleted: false,
          properties: { ...existingProperties, ...newProperties },
        },
      });
    });
  });

  describe('updateMultipleBlockStates', () => {
    it('여러 블록의 상태를 일괄 업데이트해야 한다', () => {
      // Given
      const updates = [
        {
          blockId: 'block-1',
          blockType: 'basic',
          properties: { title: 'Title 1', content: 'Content 1' }
        },
        {
          blockId: 'block-2',
          blockType: 'basic',
          properties: { title: '', content: '' }
        }
      ];

      const mockNodes = [
        { id: 'block-1', data: { blockType: 'basic', state: 'skeleton' } },
        { id: 'block-2', data: { blockType: 'basic', state: 'completed' } },
        { id: 'block-3', data: { blockType: 'basic', state: 'skeleton' } }
      ];

      mockSetNodes.mockImplementation((updater) => {
        const result = updater(mockNodes);
        return result;
      });

      const { result } = renderHook(() => useBlockStateUpdate());

      // When
      result.current.updateMultipleBlockStates(updates);

      // Then
      expect(mockSetNodes).toHaveBeenCalled();
      
      // 업데이트 함수가 호출되었는지 확인
      const updateFunction = mockSetNodes.mock.calls[0]?.[0];
      if (updateFunction) {
        const updatedNodes = updateFunction(mockNodes);
        
        // block-1은 완성 상태로 업데이트
        const block1 = updatedNodes.find((n: any) => n.id === 'block-1');
        expect(block1?.data.state).toBe('completed');
        expect(block1?.data.isCompleted).toBe(true);
        
        // block-2는 스켈레톤 상태로 업데이트
        const block2 = updatedNodes.find((n: any) => n.id === 'block-2');
        expect(block2?.data.state).toBe('skeleton');
        expect(block2?.data.isSkeleton).toBe(true);
        
        // block-3은 변경되지 않음
        const block3 = updatedNodes.find((n: any) => n.id === 'block-3');
        expect(block3?.data).toEqual(mockNodes[2]?.data);
      }
    });
  });

  describe('isBlockSkeletonState', () => {
    it('스켈레톤 상태의 블록을 올바르게 식별해야 한다', () => {
      // Given
      const blockId = 'block-1';
      const mockNode = {
        id: blockId,
        data: {
          state: 'skeleton',
          isSkeleton: true
        }
      };

      mockGetNode.mockReturnValue(mockNode);

      const { result } = renderHook(() => useBlockStateUpdate());

      // When & Then
      expect(result.current.isBlockSkeletonState(blockId)).toBe(true);
    });

    it('완성된 블록은 스켈레톤 상태가 아니어야 한다', () => {
      // Given
      const blockId = 'block-1';
      const mockNode = {
        id: blockId,
        data: {
          state: 'completed',
          isSkeleton: false
        }
      };

      mockGetNode.mockReturnValue(mockNode);

      const { result } = renderHook(() => useBlockStateUpdate());

      // When & Then
      expect(result.current.isBlockSkeletonState(blockId)).toBe(false);
    });
  });

  describe('isBlockCompletedState', () => {
    it('완성된 블록을 올바르게 식별해야 한다', () => {
      // Given
      const blockId = 'block-1';
      const mockNode = {
        id: blockId,
        data: {
          state: 'completed',
          isCompleted: true
        }
      };

      mockGetNode.mockReturnValue(mockNode);

      const { result } = renderHook(() => useBlockStateUpdate());

      // When & Then
      expect(result.current.isBlockCompletedState(blockId)).toBe(true);
    });

    it('스켈레톤 블록은 완성 상태가 아니어야 한다', () => {
      // Given
      const blockId = 'block-1';
      const mockNode = {
        id: blockId,
        data: {
          state: 'skeleton',
          isCompleted: false
        }
      };

      mockGetNode.mockReturnValue(mockNode);

      const { result } = renderHook(() => useBlockStateUpdate());

      // When & Then
      expect(result.current.isBlockCompletedState(blockId)).toBe(false);
    });
  });
});
