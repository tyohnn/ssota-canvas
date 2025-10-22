'use client';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasBlockLifecycle } from '../use-canvas-block-lifecycle';
import { createBlockAction } from '../../../actions/block.actions';

// Mock dependencies
vi.mock('@xyflow/react', () => ({
  useReactFlow: vi.fn(),
}));

vi.mock('../../../actions/block.actions', () => ({
  createBlockAction: vi.fn(),
}));

vi.mock('../../contexts/canvas-mode-context', () => ({
  useCanvasMode: vi.fn(),
}));

import { useReactFlow } from '@xyflow/react';
import { useCanvasMode } from '../../contexts/canvas-mode-context';

const mockUseReactFlow = vi.mocked(useReactFlow);
const mockCreateBlockAction = vi.mocked(createBlockAction);
const mockUseCanvasMode = vi.mocked(useCanvasMode);

describe('useCanvasBlockLifecycle', () => {
  const mockPageId = 'test-page-id';
  const mockWorkspaceId = 'test-workspace-id';
  
  // Mock React Flow methods
  const mockAddNodes = vi.fn();
  const mockDeleteElements = vi.fn();
  const mockGetNodes = vi.fn(() => [] as any[]);
  const mockUpdateNode = vi.fn();

  // Mock Canvas Mode methods
  const mockEnterSingleSelectionMode = vi.fn();
  const mockExitToDefaultMode = vi.fn();
  const mockGetCurrentMode = vi.fn(() => ({ type: 'default' as const }));

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup React Flow mock
    mockUseReactFlow.mockReturnValue({
      addNodes: mockAddNodes,
      deleteElements: mockDeleteElements,
      getNodes: mockGetNodes,
      updateNode: mockUpdateNode,
    } as any);

    // Setup Canvas Mode mock
    mockUseCanvasMode.mockReturnValue({
      enterSingleSelectionMode: mockEnterSingleSelectionMode,
      exitToDefaultMode: mockExitToDefaultMode,
      getCurrentMode: mockGetCurrentMode,
    } as any);

    // Setup Server Action mock (success by default)
    mockCreateBlockAction.mockResolvedValue({
      success: true,
      data: {
        blockMountId: 'new-block-mount-id',
        blockId: 'new-block-id',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        zOrder: 1,
        createdAt: new Date().toISOString(),
      },
    } as any);
  });

  describe('createBlock', () => {
    it('should create block with optimistic UI updates', async () => {
      const { result } = renderHook(() => 
        useCanvasBlockLifecycle({ pageId: mockPageId })
      );

      const blockType = 'text';
      const position = { x: 100, y: 100 };

      await act(async () => {
        await result.current.createBlock(blockType, position, mockWorkspaceId);
      });

      // Should add optimistic node immediately - check first call
      expect(mockAddNodes).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(/^optimistic-/),
            type: 'blockMount',
            position,
            data: expect.objectContaining({
              blockType,
              isOptimistic: true,
            }),
          })
        ])
      );

      // Should call server action
      expect(mockCreateBlockAction).toHaveBeenCalledWith({
        pageId: mockPageId,
        blockType,
        position,
        workspaceId: mockWorkspaceId,
        orgId: undefined, // 기본적으로 undefined
      });
    });

    it('should handle successful block creation', async () => {
      const { result } = renderHook(() => 
        useCanvasBlockLifecycle({ pageId: mockPageId })
      );

      const blockType = 'text';
      const position = { x: 100, y: 100 };

      await act(async () => {
        await result.current.createBlock(blockType, position, mockWorkspaceId);
      });

      // Should enter single selection mode with real block ID
      expect(mockEnterSingleSelectionMode).toHaveBeenCalledWith('new-block-id');
    });

    it('should handle block creation failure with rollback', async () => {
      // Mock server failure
      mockCreateBlockAction.mockResolvedValue({
        success: false,
        error: 'Block creation failed',
      } as any);

      const { result } = renderHook(() => 
        useCanvasBlockLifecycle({ pageId: mockPageId })
      );

      const blockType = 'text';
      const position = { x: 100, y: 100 };

      // Capture the optimistic node ID to verify rollback
      let optimisticNodeId: string;
      mockAddNodes.mockImplementation((nodes) => {
        optimisticNodeId = nodes[0].id;
      });

      await act(async () => {
        await result.current.createBlock(blockType, position, mockWorkspaceId);
      });

      // Should remove optimistic node on failure
      expect(mockDeleteElements).toHaveBeenCalledWith({
        nodes: [{ id: optimisticNodeId! }],
      });

      // Should return to default mode on failure
      expect(mockExitToDefaultMode).toHaveBeenCalled();
    });

    it('should generate unique optimistic IDs', async () => {
      const { result } = renderHook(() => 
        useCanvasBlockLifecycle({ pageId: mockPageId })
      );

      const optimisticCalls: any[] = [];
      mockAddNodes.mockImplementation((nodes) => {
        const optimisticNode = nodes.find((node: any) => node.data?.isOptimistic);
        if (optimisticNode) {
          optimisticCalls.push(optimisticNode);
        }
      });

      await act(async () => {
        await result.current.createBlock('text', { x: 100, y: 100 }, mockWorkspaceId);
        await result.current.createBlock('image', { x: 200, y: 200 }, mockWorkspaceId);
      });

      expect(optimisticCalls).toHaveLength(2);
      expect(optimisticCalls[0].id).not.toBe(optimisticCalls[1].id);
      expect(optimisticCalls[0].id).toMatch(/^optimistic-/);
      expect(optimisticCalls[1].id).toMatch(/^optimistic-/);
    });
  });

  describe('getAllBlocks', () => {
    it('should return all blocks from React Flow', () => {
      const mockNodes = [
        { id: 'block1', type: 'blockMount', data: { blockType: 'text' } },
        { id: 'block2', type: 'blockMount', data: { blockType: 'image' } },
      ];

      mockGetNodes.mockReturnValue(mockNodes);

      const { result } = renderHook(() => 
        useCanvasBlockLifecycle({ pageId: mockPageId })
      );

      expect(result.current.getAllBlocks()).toEqual(mockNodes);
    });
  });

  describe('getBlockById', () => {
    it('should return block by ID', () => {
      const mockNodes = [
        { id: 'block1', type: 'blockMount', data: { blockType: 'text' } },
        { id: 'block2', type: 'blockMount', data: { blockType: 'image' } },
      ];

      mockGetNodes.mockReturnValue(mockNodes);

      const { result } = renderHook(() => 
        useCanvasBlockLifecycle({ pageId: mockPageId })
      );

      expect(result.current.getBlockById('block1')).toEqual(mockNodes[0]);
      expect(result.current.getBlockById('block2')).toEqual(mockNodes[1]);
      expect(result.current.getBlockById('nonexistent')).toBeUndefined();
    });
  });

  describe('getBlockCount', () => {
    it('should return correct block count', () => {
      const mockNodes = [
        { id: 'block1', type: 'blockMount' },
        { id: 'block2', type: 'blockMount' },
        { id: 'block3', type: 'blockMount' },
      ];

      mockGetNodes.mockReturnValue(mockNodes);

      const { result } = renderHook(() => 
        useCanvasBlockLifecycle({ pageId: mockPageId })
      );

      expect(result.current.getBlockCount()).toBe(3);
    });
  });

  describe('programmatic control methods', () => {
    it('should add block to canvas without server call', async () => {
      const { result } = renderHook(() => 
        useCanvasBlockLifecycle({ pageId: mockPageId })
      );

      const blockId = 'test-block-id';
      const blockData = {
        blockType: 'text',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
      };

      await act(async () => {
        result.current.addBlockToCanvas(blockId, blockData);
      });

      expect(mockAddNodes).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: blockId,
            type: 'blockMount',
            data: expect.objectContaining({
              blockType: 'text',
              isOptimistic: false,
            }),
          })
        ])
      );

      // Should not call server action
      expect(mockCreateBlockAction).not.toHaveBeenCalled();
    });

    it('should remove block from canvas without server call', async () => {
      const { result } = renderHook(() => 
        useCanvasBlockLifecycle({ pageId: mockPageId })
      );

      const blockId = 'test-block-id';

      await act(async () => {
        result.current.removeBlockFromCanvas(blockId);
      });

      expect(mockDeleteElements).toHaveBeenCalledWith({
        nodes: [{ id: blockId }],
      });

      // Should not call server action (no delete action mock needed for this test)
      expect(mockCreateBlockAction).not.toHaveBeenCalled();
    });
  });
});
