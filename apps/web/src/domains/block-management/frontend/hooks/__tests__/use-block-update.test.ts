import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBlockUpdate } from '../use-block-update';
import { updateBlockInfoAction, changeBlockTypeAction } from '../../../actions/block.actions';
import { useReactFlow } from '@xyflow/react';

// Mock Server Actions
vi.mock('../../../actions/block.actions', () => ({
  updateBlockInfoAction: vi.fn(),
  changeBlockTypeAction: vi.fn()
}));

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  useReactFlow: vi.fn(() => ({
    getNode: vi.fn(),
    updateNode: vi.fn()
  }))
}));

// React hooks는 실제 구현 사용

describe('useBlockUpdate', () => {
  const mockUpdateBlockInfoAction = vi.mocked(updateBlockInfoAction);
  const mockChangeBlockTypeAction = vi.mocked(changeBlockTypeAction);
  const mockGetNode = vi.fn();
  const mockUpdateNode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock React Flow
    vi.mocked(useReactFlow).mockReturnValue({
      getNode: mockGetNode,
      updateNode: mockUpdateNode
    } as any);
  });

  describe('updateBlockInfo', () => {
    it('유효한 데이터로 블록 정보를 성공적으로 업데이트해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        properties: { content: 'Updated content' }
      };

      const originalBlockData = {
        id: blockId,
        blockType: 'basic',
        title: 'Original Title',
        description: 'Original Description',
        properties: { content: 'Original content' },
        customProperties: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetNode.mockReturnValue({ data: originalBlockData });
      mockUpdateBlockInfoAction.mockResolvedValue({
        success: true,
        data: { id: blockId, ...updateData }
      });

      const { result } = renderHook(() => useBlockUpdate(blockId));

      // When
      await act(async () => {
        await result.current.updateBlockInfo(updateData);
      });

      // Then
      expect(mockGetNode).toHaveBeenCalledWith(blockId);
      expect(mockUpdateNode).toHaveBeenCalledWith(blockId, expect.objectContaining({
        data: expect.objectContaining(updateData)
      }));
      expect(mockUpdateBlockInfoAction).toHaveBeenCalledWith(blockId, updateData);
      expect(result.current.isLoading).toBe(false);
    });

    it('업데이트 실패 시 롤백을 수행해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = { title: 'Updated Title' };

      const originalBlockData = {
        id: blockId,
        blockType: 'basic',
        title: 'Original Title',
        description: 'Original Description',
        properties: {},
        customProperties: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetNode.mockReturnValue({ data: originalBlockData });
      mockUpdateBlockInfoAction.mockResolvedValue({
        success: false,
        error: 'Update failed'
      });

      const { result } = renderHook(() => useBlockUpdate(blockId));

      // When
      await act(async () => {
        await result.current.updateBlockInfo(updateData);
      });

      // Then
      expect(mockGetNode).toHaveBeenCalledWith(blockId);
      // 낙관적 업데이트 호출
      expect(mockUpdateNode).toHaveBeenCalledWith(blockId, expect.objectContaining({
        data: expect.objectContaining(updateData)
      }));
      // 실패 시 롤백 호출
      expect(mockUpdateNode).toHaveBeenCalledWith(blockId, { data: originalBlockData });
      expect(mockUpdateBlockInfoAction).toHaveBeenCalledWith(blockId, updateData);
      expect(result.current.error).toBe('Update failed');
    });

    it('블록을 찾을 수 없는 경우 에러를 처리해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = { title: 'Updated Title' };

      mockGetNode.mockReturnValue(null);

      const { result } = renderHook(() => useBlockUpdate(blockId));

      // When
      await act(async () => {
        await result.current.updateBlockInfo(updateData);
      });

      // Then
      expect(mockGetNode).toHaveBeenCalledWith(blockId);
      expect(result.current.error).toContain('Block not found');
    });

    it('null 또는 undefined 블록 ID에 대해 에러를 처리해야 한다', async () => {
      // Given
      const updateData = { title: 'Updated Title' };

      const { result } = renderHook(() => useBlockUpdate(null as any));

      // When
      await act(async () => {
        await result.current.updateBlockInfo(updateData);
      });

      // Then
      expect(result.current.error).toContain('Invalid block ID');
    });

    it('null 또는 undefined 업데이트 데이터에 대해 에러를 처리해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';

      const { result } = renderHook(() => useBlockUpdate(blockId));

      // When
      await act(async () => {
        await result.current.updateBlockInfo(null as any);
      });

      // Then
      expect(result.current.error).toContain('Invalid update data');
    });
  });

  describe('changeBlockType', () => {
    it('유효한 블록 타입으로 성공적으로 변경해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const newBlockType = 'markdown';

      const originalBlockData = {
        id: blockId,
        blockType: 'basic',
        title: 'Original Title',
        description: 'Original Description',
        properties: {},
        customProperties: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetNode.mockReturnValue({ data: originalBlockData });
      mockChangeBlockTypeAction.mockResolvedValue({
        success: true,
        data: { id: blockId, blockType: newBlockType }
      });

      const { result } = renderHook(() => useBlockUpdate(blockId));

      // When
      await act(async () => {
        await result.current.changeBlockType(newBlockType);
      });

      // Then
      expect(mockGetNode).toHaveBeenCalledWith(blockId);
      expect(mockUpdateNode).toHaveBeenCalledWith(blockId, expect.objectContaining({
        data: expect.objectContaining({ blockType: newBlockType })
      }));
      expect(mockChangeBlockTypeAction).toHaveBeenCalledWith(blockId, newBlockType);
      expect(result.current.isLoading).toBe(false);
    });

    it('블록 타입 변경 실패 시 롤백을 수행해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const newBlockType = 'markdown';

      const originalBlockData = {
        id: blockId,
        blockType: 'basic',
        title: 'Original Title',
        description: 'Original Description',
        properties: {},
        customProperties: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetNode.mockReturnValue({ data: originalBlockData });
      mockChangeBlockTypeAction.mockResolvedValue({
        success: false,
        error: 'Change type failed'
      });

      const { result } = renderHook(() => useBlockUpdate(blockId));

      // When
      await act(async () => {
        await result.current.changeBlockType(newBlockType);
      });

      // Then
      expect(mockGetNode).toHaveBeenCalledWith(blockId);
      // 낙관적 업데이트 호출
      expect(mockUpdateNode).toHaveBeenCalledWith(blockId, expect.objectContaining({
        data: expect.objectContaining({ blockType: newBlockType })
      }));
      // 실패 시 롤백 호출
      expect(mockUpdateNode).toHaveBeenCalledWith(blockId, { data: originalBlockData });
      expect(mockChangeBlockTypeAction).toHaveBeenCalledWith(blockId, newBlockType);
      expect(result.current.error).toBe('Change type failed');
    });

    it('유효하지 않은 블록 타입에 대해 에러를 처리해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const newBlockType = 'invalid-type';

      const originalBlockData = {
        id: blockId,
        blockType: 'basic',
        title: 'Original Title',
        description: 'Original Description',
        properties: {},
        customProperties: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetNode.mockReturnValue({ data: originalBlockData });
      mockChangeBlockTypeAction.mockResolvedValue({
        success: false,
        error: 'Invalid block type'
      });

      const { result } = renderHook(() => useBlockUpdate(blockId));

      // When
      await act(async () => {
        await result.current.changeBlockType(newBlockType);
      });

      // Then
      expect(result.current.error).toBe('Invalid block type');
    });

    it('null 또는 undefined 블록 ID에 대해 에러를 처리해야 한다', async () => {
      // Given
      const newBlockType = 'markdown';

      const { result } = renderHook(() => useBlockUpdate(null as any));

      // When
      await act(async () => {
        await result.current.changeBlockType(newBlockType);
      });

      // Then
      expect(result.current.error).toContain('Invalid block ID');
    });

    it('null 또는 undefined 블록 타입에 대해 에러를 처리해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';

      const { result } = renderHook(() => useBlockUpdate(blockId));

      // When
      await act(async () => {
        await result.current.changeBlockType(null as any);
      });

      // Then
      expect(result.current.error).toContain('Invalid block type');
    });
  });

  describe('상태 관리', () => {
    it('로딩 상태를 올바르게 관리해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = { title: 'Updated Title' };

      let resolvePromise: (value: { success: boolean; data?: any; error?: string }) => void;
      const promise = new Promise<{ success: boolean; data?: any; error?: string }>((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdateBlockInfoAction.mockReturnValue(promise);

      const { result } = renderHook(() => useBlockUpdate(blockId));

      // When
      act(() => {
        result.current.updateBlockInfo(updateData);
      });

      // Then
      expect(result.current.isLoading).toBe(true);

      // When
      await act(async () => {
        resolvePromise!({ success: true, data: {} });
      });

      // Then
      expect(result.current.isLoading).toBe(false);
    });

    it('에러 상태를 올바르게 관리해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = { title: 'Updated Title' };

      mockUpdateBlockInfoAction.mockResolvedValue({
        success: false,
        error: 'Test error'
      });

      const { result } = renderHook(() => useBlockUpdate(blockId));

      // When
      await act(async () => {
        await result.current.updateBlockInfo(updateData);
      });

      // Then
      expect(result.current.error).toBe('Test error');
    });
  });
});
