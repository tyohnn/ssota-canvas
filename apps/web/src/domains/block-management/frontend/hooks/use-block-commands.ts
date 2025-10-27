/**
 * Block Commands Hook
 *
 * 블록 관련 명령어들을 제공하는 훅
 * - 블록 크기 업데이트
 * - 블록 스타일 업데이트
 * - 블록 속성 업데이트
 */

import { useCallback } from 'react';
import { updateBlockSizeAction } from '../../../canvas-management/actions/block.actions';
import { isFailure } from '@/lib/action-result';

export interface BlockSizeUpdate {
  width: number;
  height: number;
  pageId?: string;
  orgId?: string;
  workspaceId?: string;
}

export interface BlockStyleUpdate {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
}

export interface BlockCommandsResult {
  ok: boolean;
  error?: string;
}

export function useBlockCommands() {
  /**
   * 블록 크기 업데이트
   */
  const updateBlockSize = useCallback(
    async (
      blockMountId: string,
      size: BlockSizeUpdate
    ): Promise<BlockCommandsResult> => {
      try {
        // Canvas Management Server Action 호출
        const result = await updateBlockSizeAction({
          blockMountId,
          newSize: {
            width: size.width,
            height: size.height,
          },
          pageId: size.pageId,
          orgId: size.orgId,
          workspaceId: size.workspaceId,
        });

        if (isFailure(result)) {
          return {
            ok: false,
            error: result.error || 'Failed to update block mount size',
          };
        }

        return { ok: true };
      } catch (error) {
        console.error('블록 마운트 크기 업데이트 실패:', error);
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    []
  );

  /**
   * 블록 스타일 업데이트
   */
  const updateBlockStyle = useCallback(
    async (
      nodeId: string,
      style: BlockStyleUpdate
    ): Promise<BlockCommandsResult> => {
      try {
        // TODO: 실제 DB 업데이트 로직 구현
        // React Flow가 이미 optimistic update를 처리하므로 별도 처리 불필요
        console.log('블록 스타일 업데이트:', nodeId, style);

        return { ok: true };
      } catch (error) {
        console.error('블록 스타일 업데이트 실패:', error);
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    []
  );

  return {
    updateBlockSize,
    updateBlockStyle,
  };
}
