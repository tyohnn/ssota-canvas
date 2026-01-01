/**
 * Block Commands Hook
 *
 * 블록 관련 명령어들을 제공하는 훅
 * - 블록 크기 업데이트
 * - 블록 크기 업데이트 (Optimistic)
 * - 블록 스타일 업데이트
 * - 블록 속성 업데이트
 */

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { updateBlockSizeAction } from '../../../canvas-management/actions/block.actions';
import { isFailure } from '@/lib';

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
  const { setNodes, getNodes } = useReactFlow();

  /**
   * 블록 크기 업데이트 (서버 저장만)
   * Resizer에서 사용: NodeResizeControl이 이미 React Flow를 업데이트했으므로 서버 저장만 필요
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
   * 블록 크기 업데이트 (Optimistic Update 포함)
   * 이미지 업로드/변경에서 사용: React Flow가 자동으로 업데이트하지 않으므로 optimistic update 필요
   */
  const updateBlockSizeWithOptimistic = useCallback(
    async (
      blockMountId: string,
      size: BlockSizeUpdate
    ): Promise<BlockCommandsResult> => {
      // 1. 현재 노드 크기 백업 (롤백용)
      const nodes = getNodes();
      const currentNode = nodes.find(n => n.id === blockMountId);
      const previousSize = currentNode
        ? {
            width: currentNode.width || 300,
            height: currentNode.height || 200,
          }
        : null;

      try {
        // 2. Optimistic update: React Flow 노드 즉시 업데이트
        setNodes(nodes =>
          nodes.map(node =>
            node.id === blockMountId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    size: { width: size.width, height: size.height },
                  },
                  width: size.width,
                  height: size.height,
                }
              : node
          )
        );

        // 3. 서버에 저장
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
          // 실패 시 롤백 (이전 크기로 복원)
          if (previousSize) {
            setNodes(nodes =>
              nodes.map(node =>
                node.id === blockMountId
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        size: previousSize,
                      },
                      width: previousSize.width,
                      height: previousSize.height,
                    }
                  : node
              )
            );
          }

          return {
            ok: false,
            error: result.error || 'Failed to update block mount size',
          };
        }

        return { ok: true };
      } catch (error) {
        console.error('블록 마운트 크기 업데이트 실패:', error);
        // 에러 발생 시 롤백 (이전 크기로 복원)
        if (previousSize) {
          setNodes(nodes =>
            nodes.map(node =>
              node.id === blockMountId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      size: previousSize,
                    },
                    width: previousSize.width,
                    height: previousSize.height,
                  }
                : node
            )
          );
        }

        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [setNodes, getNodes]
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
    updateBlockSizeWithOptimistic,
    updateBlockStyle,
  };
}
