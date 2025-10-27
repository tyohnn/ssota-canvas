import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock all dependencies
vi.mock('../../../actions/block.actions', () => ({
  updateBlockAction: vi.fn(),
}));

vi.mock('@xyflow/react', () => ({
  useReactFlow: vi.fn(),
}));

vi.mock('../use-block-state-update', () => ({
  useBlockStateUpdate: vi.fn(),
}));

import { useBlockFieldUpdate } from '../../hooks/use-block-field-update';
import { updateBlockAction } from '../../../actions/block.actions';
import { useReactFlow } from '@xyflow/react';
import { useBlockStateUpdate } from '../use-block-state-update';
import { BlockView } from '../../../shared/types';

describe('useBlockFieldUpdate', () => {
  const mockBlockId = '123e4567-e89b-12d3-a456-426614174000';
  const mockNode = {
    id: mockBlockId,
    data: {
      blockType: 'basic',
      properties: {
        title: 'Test Title',
        content: 'Test Content',
      customProperties: [],
      },
    },
  };

  const mockGetNode = vi.fn();
  const mockUpdateNode = vi.fn();
  const mockUpdateBlockRenderState = vi.fn();
  const mockUpdateBlockAction = vi.mocked(updateBlockAction);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocks
    mockGetNode.mockReturnValue(mockNode);
    mockUpdateNode.mockImplementation(() => {});
    mockUpdateBlockRenderState.mockImplementation(() => {});
    
    vi.mocked(useReactFlow).mockReturnValue({
      getNode: mockGetNode,
      updateNode: mockUpdateNode,
    } as any);

    vi.mocked(useBlockStateUpdate).mockReturnValue({
      updateBlockRenderState: mockUpdateBlockRenderState,
    } as any);

    mockUpdateBlockAction.mockResolvedValue({
      success: true,
      data: {
        id: mockBlockId,
        workspaceId: 'workspace-123',
        canvasId: 'canvas-123',
        type: 'basic',
        position: { x: 100, y: 100 },
        properties: { title: 'Updated Title', content: 'Test Content' },
        customProperties: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BlockView,
    });
  });

  describe('updateField', () => {
    it('should update a simple field successfully', async () => {
      const { result } = renderHook(() => useBlockFieldUpdate());

      await act(async () => {
        await result.current.updateField(mockBlockId, 'title', 'New Title');
      });

      expect(mockUpdateNode).toHaveBeenCalledWith(mockBlockId, {
        data: expect.objectContaining({
          title: 'New Title',
        }),
      });
      expect(mockUpdateBlockAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        properties: expect.any(Object),
      });
    });

    it('should handle update failure gracefully', async () => {
      mockUpdateBlockAction.mockResolvedValue({
        success: false,
        error: 'Update failed',
      });

      const { result } = renderHook(() => useBlockFieldUpdate());

      await expect(
        act(async () => {
          await result.current.updateField(mockBlockId, 'title', 'New Title');
        })
      ).rejects.toThrow('Update failed');
    });

    it('should handle missing node gracefully', async () => {
      mockGetNode.mockReturnValue(null);

      const { result } = renderHook(() => useBlockFieldUpdate());

      await expect(
        act(async () => {
          await result.current.updateField(mockBlockId, 'title', 'New Title');
        })
      ).rejects.toThrow('Block not found');
    });
  });

  describe('resetField', () => {
    it('should reset field to null', async () => {
      const { result } = renderHook(() => useBlockFieldUpdate());

      await act(async () => {
        await result.current.resetField(mockBlockId, 'title');
      });

      expect(mockUpdateNode).toHaveBeenCalledWith(mockBlockId, {
        data: expect.objectContaining({
          title: null,
        }),
      });
    });
  });
});