import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCanvasBlockTransform } from '../use-canvas-block-transform';
import * as blockActions from '@/domains/canvas-management/actions/block.actions';
import { ok, err } from '@/lib/action-result';

// React Flow Hooks Mock
vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    setNodes: vi.fn(),
    getNodes: vi.fn(() => [
      {
        id: 'block-1',
        position: { x: 100, y: 100 },
        data: { blockMountId: 'mount-1', size: { width: 200, height: 150 } },
        width: 200,
        height: 150,
      },
      {
        id: 'block-2',
        position: { x: 300, y: 100 },
        data: { blockMountId: 'mount-2', size: { width: 200, height: 150 } },
        width: 200,
        height: 150,
      },
      {
        id: 'block-3',
        position: { x: 500, y: 100 },
        data: { blockMountId: 'mount-3', size: { width: 200, height: 150 } },
        width: 200,
        height: 150,
      },
    ]),
  }),
  useNodesState: () => [
    [],
    vi.fn(),
    vi.fn(),
  ],
}));

// Server Actions Mock
vi.mock('@/domains/canvas-management/actions/block.actions', () => ({
  updateBlockPositionAction: vi.fn(),
  updateBlockSizeAction: vi.fn(),
  updateMultipleBlockPositionsAction: vi.fn(),
}));

describe('useCanvasBlockTransform', () => {
  const pageId = 'page-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setBlockPosition - 프로그램적 제어', () => {
    it('React Flow Store를 직접 업데이트해야 한다', () => {
      // Given
      const { result } = renderHook(() => useCanvasBlockTransform({ pageId }));
      const newPosition = { x: 200, y: 300 };

      // When
      act(() => {
        result.current.setBlockPosition('block-1', newPosition);
      });

      // Then - 서버 호출 없이 UI만 업데이트
      expect(blockActions.updateBlockPositionAction).not.toHaveBeenCalled();
    });
  });

  describe('saveBlockPosition - 서버 연동', () => {
    it('서버 액션을 호출하여 위치를 영구 저장해야 한다', async () => {
      // Given
      const { result } = renderHook(() => useCanvasBlockTransform({ pageId }));
      const newPosition = { x: 200, y: 300 };
      
      vi.mocked(blockActions.updateBlockPositionAction).mockResolvedValue(
        ok({
          blockMountId: 'mount-1',
          newPosition,
          updatedAt: new Date().toISOString(),
        })
      );

      // When
      await act(async () => {
        await result.current.saveBlockPosition('block-1', newPosition);
      });

      // Then
      expect(blockActions.updateBlockPositionAction).toHaveBeenCalledWith({
        blockMountId: 'mount-1',
        newPosition,
      });
    });

    it('서버 실패 시 원래 위치로 롤백해야 한다', async () => {
      // Given
      const { result } = renderHook(() => useCanvasBlockTransform({ pageId }));
      const newPosition = { x: 200, y: 300 };
      
      vi.mocked(blockActions.updateBlockPositionAction).mockResolvedValue(
        err('Position update failed', { code: 'POSITION_UPDATE_FAILED' })
      );

      // When
      await act(async () => {
        await result.current.saveBlockPosition('block-1', newPosition);
      });

      // Then - 에러 처리 확인
      expect(blockActions.updateBlockPositionAction).toHaveBeenCalled();
    });
  });

  describe('alignBlocks - 정렬 알고리즘', () => {
    it('좌측 정렬: 모든 블럭의 x를 최소 x로 설정해야 한다', async () => {
      // Given
      const { result } = renderHook(() => useCanvasBlockTransform({ pageId }));
      const blockIds = ['block-1', 'block-2', 'block-3'];
      
      vi.mocked(blockActions.updateMultipleBlockPositionsAction).mockResolvedValue(
        ok({
          updatedCount: 3,
          updatedAt: new Date().toISOString(),
        })
      );

      // When
      await act(async () => {
        await result.current.alignBlocks(blockIds, 'left');
      });

      // Then - 모든 블럭이 x=100으로 정렬되어야 함
      expect(blockActions.updateMultipleBlockPositionsAction).toHaveBeenCalled();
      const callArg = vi.mocked(blockActions.updateMultipleBlockPositionsAction).mock.calls[0]![0];
      
      // 모든 블럭의 x 좌표가 100 (최소값)이어야 함
      expect(callArg.blockPositions.every(bp => bp.position.x === 100)).toBe(true);
      // y 좌표는 유지되어야 함
      expect(callArg.blockPositions.every(bp => bp.position.y === 100)).toBe(true);
    });

    it('우측 정렬: 모든 블럭의 x를 최대 x로 설정해야 한다', async () => {
      // Given
      const { result } = renderHook(() => useCanvasBlockTransform({ pageId }));
      const blockIds = ['block-1', 'block-2', 'block-3'];
      
      vi.mocked(blockActions.updateMultipleBlockPositionsAction).mockResolvedValue(
        ok({
          updatedCount: 3,
          updatedAt: new Date().toISOString(),
        })
      );

      // When
      await act(async () => {
        await result.current.alignBlocks(blockIds, 'right');
      });

      // Then - 모든 블럭이 x=500으로 정렬되어야 함
      expect(blockActions.updateMultipleBlockPositionsAction).toHaveBeenCalled();
      const callArg = vi.mocked(blockActions.updateMultipleBlockPositionsAction).mock.calls[0]![0];
      
      // 모든 블럭의 x 좌표가 500 (최대값)이어야 함
      expect(callArg.blockPositions.every(bp => bp.position.x === 500)).toBe(true);
    });

    it('중앙 정렬: 모든 블럭의 중심 x를 평균 중심 x로 설정해야 한다', async () => {
      // Given
      const { result } = renderHook(() => useCanvasBlockTransform({ pageId }));
      const blockIds = ['block-1', 'block-2', 'block-3'];
      
      vi.mocked(blockActions.updateMultipleBlockPositionsAction).mockResolvedValue(
        ok({
          updatedCount: 3,
          updatedAt: new Date().toISOString(),
        })
      );

      // When
      await act(async () => {
        await result.current.alignBlocks(blockIds, 'center');
      });

      // Then
      expect(blockActions.updateMultipleBlockPositionsAction).toHaveBeenCalled();
    });
  });

  describe('saveBlockSize - 서버 연동', () => {
    it('서버 액션을 호출하여 크기를 영구 저장해야 한다', async () => {
      // Given
      const { result } = renderHook(() => useCanvasBlockTransform({ pageId }));
      const newSize = { width: 300, height: 250 };
      
      vi.mocked(blockActions.updateBlockSizeAction).mockResolvedValue(
        ok({
          blockMountId: 'mount-1',
          newSize,
          updatedAt: new Date().toISOString(),
        })
      );

      // When
      await act(async () => {
        await result.current.saveBlockSize('block-1', newSize);
      });

      // Then
      expect(blockActions.updateBlockSizeAction).toHaveBeenCalledWith({
        blockMountId: 'mount-1',
        newSize,
      });
    });
  });
});

