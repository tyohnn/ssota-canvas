'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { updateBlockSizeAction } from '@/domains/canvas-management/actions/block-mount/update-block-size.action';
import {
  type UpdateBlockSizeRequestInput,
  UpdateBlockSizeRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type { BlockSizeUpdatedDTO } from '@/domains/canvas-management/shared/dtos/responses';
import type { Size } from '@/domains/canvas-management/shared/types/common.types';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getNodes: () => Node[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  addNodes: (nodes: Node[]) => void;
  deleteElements: (elements: { nodes: Array<{ id: string }> }) => void;
};

export type UseUpdateBlockSizeParams = {
  reactFlow: ReactFlowDependencies;
  onSuccess?: (result: BlockSizeUpdatedDTO) => void;
  onError?: () => void;
};

export type UpdateBlockSizeInput = {
  blockMountId: string;
  newSize: Size;
};

export type UseUpdateBlockSizeResult = {
  updateBlockSize: (
    input: UpdateBlockSizeInput
  ) => Promise<BlockSizeUpdatedDTO | null>;
  isUpdating: boolean;
};

/**
 * 블록 크기 업데이트 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 */
export function useUpdateBlockSize(
  params: UseUpdateBlockSizeParams
): UseUpdateBlockSizeResult {
  const { reactFlow, onSuccess, onError } = params;
  const { getNodes, setNodes } = reactFlow;

  const mutation = useMutation({
    mutationFn: async (input: UpdateBlockSizeInput) => {
      // Validation
      const rawRequest: UpdateBlockSizeRequestInput = {
        blockMountId: input.blockMountId,
        newSize: input.newSize,
      };

      const parseResult = UpdateBlockSizeRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid size request');
      }

      const validatedRequest = parseResult.data;

      // Server Action
      const result = await updateBlockSizeAction(validatedRequest);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async (input: UpdateBlockSizeInput) => {
      // 현재 노드 백업 (롤백용)
      const currentNodes = getNodes();
      const node = currentNodes.find(n => n.id === input.blockMountId);
      const previousNode = node
        ? {
            ...node,
            width: node.width,
            height: node.height,
            data: { ...node.data },
          }
        : null;

      // Optimistic UI - React Flow Store 즉시 업데이트
      setNodes(
        (nodes: Node[]) =>
          nodes.map((node: Node) => {
            if (node.id === input.blockMountId) {
              return {
                ...node,
                width: input.newSize.width,
                height: input.newSize.height,
                data: {
                  ...node.data,
                  size: input.newSize,
                },
              };
            }
            return node;
          }) as Node[]
      );

      // 롤백용 컨텍스트 반환
      return { previousNode, blockMountId: input.blockMountId };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      // 크기 복원 (실패 시)
      if (context?.previousNode) {
        setNodes(
          (nodes: Node[]) =>
            nodes.map((node: Node) => {
              if (node.id === context.blockMountId) {
                return {
                  ...node,
                  width: context.previousNode!.width,
                  height: context.previousNode!.height,
                  data: context.previousNode!.data,
                };
              }
              return node;
            }) as Node[]
        );
      }
      console.error('Failed to update block size:', error);
      onError?.();
    },

    // Success
    onSuccess: (data, variables, context) => {
      onSuccess?.(data);
    },
  });

  return {
    updateBlockSize: async (
      input: UpdateBlockSizeInput
    ): Promise<BlockSizeUpdatedDTO | null> => {
      try {
        return await mutation.mutateAsync(input);
      } catch (error) {
        return null;
      }
    },
    isUpdating: mutation.isPending,
  };
}
