'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { moveBlockToPageAction } from '@/domains/canvas-management/actions/block-mount/move-block-to-page.action';
import {
  type MoveBlockToPageRequestInput,
  MoveBlockToPageRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type { BlockMovedToPageDTO } from '@/domains/canvas-management/shared/dtos/responses';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getNodes: () => Node[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  addNodes: (nodes: Node[]) => void;
};

export type UseMoveBlockToPageParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
  onExit?: () => void; // exitToDefaultMode
  onSuccess?: (block: BlockMovedToPageDTO) => void;
  onError?: () => void;
};

export type MoveBlockToPageInput = {
  blockMountId: string;
  targetPageId: string;
};

export type UseMoveBlockToPageResult = {
  moveBlockToPage: (input: MoveBlockToPageInput) => Promise<boolean>;
  isMoving: boolean;
};

/**
 * 블록 페이지 이동 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 */
export function useMoveBlockToPage(
  params: UseMoveBlockToPageParams
): UseMoveBlockToPageResult {
  const { pageId, reactFlow, onExit, onSuccess, onError } = params;
  const { getNodes, setNodes, addNodes } = reactFlow;

  const mutation = useMutation({
    mutationFn: async (input: MoveBlockToPageInput) => {
      const rawRequest: MoveBlockToPageRequestInput = {
        pageId,
        blockMountId: input.blockMountId,
        targetPageId: input.targetPageId,
      };

      const parseResult = MoveBlockToPageRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid move request');
      }

      const validatedRequest = parseResult.data;

      // Server Action
      const result = await moveBlockToPageAction(validatedRequest);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async (input: MoveBlockToPageInput) => {
      // 현재 노드 백업 (롤백용)
      const nodeToRemove = getNodes().find(
        node => node.id === input.blockMountId
      );
      const previousNode = nodeToRemove ? { ...nodeToRemove } : null;

      // Optimistic UI - setNodes로 블록 제거 (onNodesDelete 트리거 방지)
      setNodes(
        (nodes: Node[]) =>
          nodes.filter((node: Node) => node.id !== input.blockMountId) as Node[]
      );

      // 기본 모드로 복귀
      onExit?.();

      // 롤백용 컨텍스트 반환
      return { previousNode, blockMountId: input.blockMountId };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      // 블록 복원 (실패 시)
      if (context?.previousNode) {
        addNodes([context.previousNode]);
      }
      console.error('Failed to move block:', error);
      onError?.();
    },

    // Success
    onSuccess: (data, variables, context) => {
      onSuccess?.(data);
    },
  });

  return {
    moveBlockToPage: async (input: MoveBlockToPageInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(input);
        return true;
      } catch (error) {
        return false;
      }
    },
    isMoving: mutation.isPending,
  };
}
