'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { updateBlockPositionAction } from '@/domains/canvas-management/actions/block-mount/update-block-position.action';
import {
  type UpdateBlockPositionRequestInput,
  UpdateBlockPositionRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type { BlockPositionUpdatedDTO } from '@/domains/canvas-management/shared/dtos/responses';
import type { Position } from '@/domains/canvas-management/shared/types/common.types';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getNodes: () => Node[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  addNodes: (nodes: Node[]) => void;
  deleteElements: (elements: { nodes: Array<{ id: string }> }) => void;
};

export type UseUpdateBlockPositionParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
  onSuccess?: (result: BlockPositionUpdatedDTO[]) => void;
  onError?: () => void;
};

export type UpdateBlockPositionInput = {
  blockPositions: Array<{
    blockMountId: string;
    position: Position;
  }>;
};

export type UseUpdateBlockPositionResult = {
  updateBlockPosition: (
    input: UpdateBlockPositionInput
  ) => Promise<BlockPositionUpdatedDTO[] | null>;
  isUpdating: boolean;
};

/**
 * 블록 위치 업데이트 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 * - 단일/다중 블록 위치 업데이트 지원
 */
export function useUpdateBlockPosition(
  params: UseUpdateBlockPositionParams
): UseUpdateBlockPositionResult {
  const { pageId, reactFlow, onSuccess, onError } = params;
  const { getNodes, setNodes } = reactFlow;

  const mutation = useMutation({
    mutationFn: async (input: UpdateBlockPositionInput) => {
      // Validation
      const rawRequest: UpdateBlockPositionRequestInput = {
        blockPositions: input.blockPositions,
        pageId,
      };

      const parseResult =
        UpdateBlockPositionRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid position request');
      }

      const validatedRequest = parseResult.data;

      // Server Action
      const result = await updateBlockPositionAction(validatedRequest);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async (input: UpdateBlockPositionInput) => {
      // 현재 노드들 백업 (롤백용)
      const currentNodes = getNodes();
      const previousPositions = new Map<string, Position>();

      // 업데이트할 노드들의 이전 위치 저장
      input.blockPositions.forEach(bp => {
        const node = currentNodes.find(n => n.id === bp.blockMountId);
        if (node) {
          previousPositions.set(bp.blockMountId, {
            x: node.position.x,
            y: node.position.y,
          });
        }
      });

      // Optimistic UI - React Flow Store 즉시 업데이트
      setNodes(
        (nodes: Node[]) =>
          nodes.map((node: Node) => {
            const newPosition = input.blockPositions.find(
              bp => bp.blockMountId === node.id
            );
            return newPosition
              ? { ...node, position: newPosition.position }
              : node;
          }) as Node[]
      );

      // 롤백용 컨텍스트 반환
      return { previousPositions };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      // 위치 복원 (실패 시)
      if (context?.previousPositions) {
        setNodes(
          (nodes: Node[]) =>
            nodes.map((node: Node) => {
              const previousPosition = context.previousPositions.get(node.id);
              return previousPosition
                ? { ...node, position: previousPosition }
                : node;
            }) as Node[]
        );
      }
      console.error('Failed to update block positions:', error);
      onError?.();
    },

    // Success
    onSuccess: (data, variables, context) => {
      onSuccess?.(data);
    },
  });

  return {
    updateBlockPosition: async (
      input: UpdateBlockPositionInput
    ): Promise<BlockPositionUpdatedDTO[] | null> => {
      try {
        return await mutation.mutateAsync(input);
      } catch (error) {
        return null;
      }
    },
    isUpdating: mutation.isPending,
  };
}
