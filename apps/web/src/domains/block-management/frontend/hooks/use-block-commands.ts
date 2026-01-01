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

import { updateBlockSizeAction } from '@/domains/canvas-management/actions/block/update-block-size.action';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getNodes: () => Node[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
};

export type UseUpdateBlockSizeParams = {
  reactFlow: ReactFlowDependencies;
};

export type UpdateBlockSizeInput = {
  blockMountId: string;
  width: number;
  height: number;
  pageId: string;
  optimistic?: boolean; // Optimistic update 여부 (기본값: false)
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
  const { reactFlow } = params;
  const { getNodes, setNodes } = reactFlow;

  const mutation = useMutation({
    mutationFn: async (input: UpdateBlockSizeInput) => {
      const result = await updateBlockSizeAction({
        blockMountId: input.blockMountId,
        newSize: {
          width: input.width,
          height: input.height,
        },
      });

      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update (optimistic=true일 때만)
    onMutate: async (input: UpdateBlockSizeInput) => {
      if (!input.optimistic) {
        return { previousNode: null };
      }

      const nodes = getNodes();
      const currentNode = nodes.find(n => n.id === input.blockMountId);

      if (!currentNode) {
        return { previousNode: null };
      }

      // Optimistic update: React Flow 노드 즉시 업데이트
      setNodes(nodes =>
        nodes.map(node =>
          node.id === input.blockMountId
            ? {
                ...node,
                data: {
                  ...node.data,
                  size: { width: input.width, height: input.height },
                },
                width: input.width,
                height: input.height,
              }
            : node
        )
      );

      return { previousNode: currentNode };
    },

    // 자동 롤백 (optimistic update가 있었을 때만)
    onError: (error, variables, context) => {
      if (context?.previousNode && variables.optimistic) {
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
