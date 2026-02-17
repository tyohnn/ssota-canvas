/**
 * Block Commands Hook
 *
 * 블록 관련 명령어들을 제공하는 훅
 * - 블록 크기 업데이트 (TanStack Query Optimistic Update)
 * - 블록 스타일 업데이트
 */
'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';
import { useUpdateNodeInternals } from '@xyflow/react';

import { BaseNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { updateBlockSizeAction } from '@/domains/canvas-management/actions/block-mount/update-block-size.action';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getNodes: () => Node[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
};

export type UseUpdateBlockSizeParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
};

export type UpdateBlockSizeInput = {
  blockMountId: string;
  width: number;
  height: number;
  viewMode?: 'note' | 'original' | 'card'; // 현재 viewMode (선택적, 없으면 현재 BlockMount의 viewMode 사용)
};

export type UseUpdateBlockSizeResult = {
  updateBlockSize: (input: UpdateBlockSizeInput) => Promise<boolean>;
  isUpdating: boolean;
};

export interface BlockStyleUpdate {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
}

export interface BlockCommandsResult {
  ok: boolean;
  error?: string;
}

/**
 * 블록 크기 업데이트 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate, optimistic=true일 때)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 */
export function useUpdateBlockSize(
  params: UseUpdateBlockSizeParams
): UseUpdateBlockSizeResult {
  const { pageId, reactFlow } = params;
  const { getNodes, setNodes } = reactFlow;
  const updateNodeInternals = useUpdateNodeInternals();

  const mutation = useMutation({
    mutationFn: async (input: UpdateBlockSizeInput) => {
      const result = await updateBlockSizeAction({
        pageId,
        blockMountId: input.blockMountId,
        newSize: {
          width: input.width,
          height: input.height,
        },
        viewMode: input.viewMode,
      });

      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update (optimistic=true일 때만)
    onMutate: async (input: UpdateBlockSizeInput) => {
      const nodes = getNodes();
      const currentNode = nodes.find(n => n.id === input.blockMountId);

      if (!currentNode) {
        return { previousNode: null };
      }

      const nodeData = currentNode.data as BaseNodeData;
      const currentViewMode = nodeData.viewMode || 'original';
      const targetViewMode = input.viewMode || currentViewMode;

      // sizes 업데이트
      const updatedSizes = {
        ...(nodeData.sizes || {}),
        [targetViewMode]: {
          width: input.width,
          height: input.height,
        },
      };

      // Optimistic update: React Flow 노드 즉시 업데이트
      setNodes(nodes =>
        nodes.map(node =>
          node.id === input.blockMountId
            ? {
                ...node,
                data: {
                  ...node.data,
                  sizes: updatedSizes,
                },
                width: input.width,
                height: input.height,
              }
            : node
        )
      );

      // React Flow에게 노드 내부가 변경되었음을 알림
      // 크기가 변경되었으므로 엣지가 새로운 핸들 위치에 올바르게 연결되도록 함
      updateNodeInternals(input.blockMountId);

      return { previousNode: currentNode };
    },

    // 자동 롤백 (optimistic update가 있었을 때만)
    onError: (error, variables, context) => {
      if (context?.previousNode) {
        setNodes(nodes =>
          nodes.map(node =>
            node.id === variables.blockMountId ? context.previousNode! : node
          )
        );
      }
    },
  });

  return {
    updateBlockSize: async (input: UpdateBlockSizeInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(input);
        return true;
      } catch (error) {
        return false;
      }
    },
    isUpdating: mutation.isPending,
  };
}

/**
 * 블록 스타일 업데이트
 * TODO: 실제 DB 업데이트 로직 구현
 */
export function useUpdateBlockStyle(): {
  updateBlockStyle: (
    nodeId: string,
    style: BlockStyleUpdate
  ) => Promise<BlockCommandsResult>;
} {
  const updateBlockStyle = async (
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
  };

  return {
    updateBlockStyle,
  };
}
