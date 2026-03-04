'use client';

import { useRef } from 'react';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { softDeleteBlockMountAction } from '@/domains/canvas-management/actions/block-mount/soft-delete-block-mount.action';
import {
  type SoftDeleteBlockMountRequestInput,
  SoftDeleteBlockMountRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type { BlockMountSoftDeletedDTO } from '@/domains/canvas-management/shared/dtos/responses';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getNodes: () => Node[];
  setNodes: (nodes: Node[]) => void;
  addNodes: (nodes: Node[]) => void;
  deleteElements: (elements: { nodes: Array<{ id: string }> }) => void;
};

export type UseSoftDeleteBlockParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
  onSuccess?: () => void;
  onError?: () => void;
};

export type SoftDeleteBlockInput = {
  blockMountIds: string | string[]; // 단일/다중 지원
};

export type UseSoftDeleteBlockResult = {
  softDeleteBlock: (input: SoftDeleteBlockInput) => Promise<boolean>;
  isDeleting: boolean;
};

/**
 * 블록 삭제 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 제거 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 복원 (onError)
 * - 로딩 상태 자동 관리
 * - 중복 삭제 방지
 * - Optimistic/Real Node 분리 처리
 */
export function useSoftDeleteBlock(
  params: UseSoftDeleteBlockParams
): UseSoftDeleteBlockResult {
  const { pageId, reactFlow, onSuccess, onError } = params;
  const { getNodes, setNodes, addNodes, deleteElements } = reactFlow;

  // 중복 삭제 방지를 위한 Set (현재 삭제 진행 중인 blockMountId들)
  const deletingBlockMountsRef = useRef<Set<string>>(new Set());

  /**
   * 블록 마운트 ID 정규화 및 노드 분리
   */
  const normalizeAndSeparateNodes = (
    blockMountIds: string | string[]
  ):
    | { shouldReturn: true; reason: string }
    | {
        shouldReturn: false;
        normalizedBlockMountIds: string[];
        nodesToDelete: Node[];
        optimisticNodes: Node[];
        realNodes: Node[];
        realBlockMountIds: string[];
        pageId: string;
      } => {
    // blockMountIds를 배열로 정규화
    const normalizedBlockMountIds = Array.isArray(blockMountIds)
      ? blockMountIds
      : [blockMountIds];

    // 삭제 전 노드들 백업 (롤백용)
    const nodesToDelete = getNodes().filter(node =>
      normalizedBlockMountIds.includes(node.id)
    );

    if (nodesToDelete.length === 0) {
      return { shouldReturn: true, reason: 'No nodes found to delete' };
    }

    // Optimistic 노드와 실제 노드 분리 (충돌 방지)
    const optimisticNodes = nodesToDelete.filter(node =>
      node.id.startsWith('optimistic-')
    );
    const realNodes = nodesToDelete.filter(
      node => !node.id.startsWith('optimistic-')
    );

    // pageId: 노드 데이터에서 추출, 없으면 params.pageId 사용 (router block 등)
    const firstRealNode = realNodes[0] || nodesToDelete[0];
    const nodePageId = (firstRealNode?.data as BlockNodeData | undefined)?.pageId;
    const resolvedPageId = nodePageId || pageId;

    return {
      shouldReturn: false,
      normalizedBlockMountIds,
      nodesToDelete,
      optimisticNodes,
      realNodes,
      realBlockMountIds: realNodes.map(node => node.id),
      pageId: resolvedPageId,
    };
  };

  const mutation = useMutation({
    mutationFn: async (input: SoftDeleteBlockInput) => {
      // 노드 정규화 및 분리
      const nodeData = normalizeAndSeparateNodes(input.blockMountIds);

      if (nodeData.shouldReturn) {
        throw new Error(nodeData.reason);
      }

      const { optimisticNodes, realNodes, realBlockMountIds } = nodeData;

      // Optimistic 노드만 있는 경우 서버 호출 없이 성공으로 처리
      if (realNodes.length === 0) {
        return {
          deletedBlockMountIds: optimisticNodes.map(node => node.id),
        } as BlockMountSoftDeletedDTO;
      }

      // Validation
      const rawRequest: SoftDeleteBlockMountRequestInput = {
        blockMountIds: realBlockMountIds,
        pageId,
      };

      const parseResult =
        SoftDeleteBlockMountRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid delete request');
      }

      // Server Action
      const result = await softDeleteBlockMountAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }
      return result.data;
    },

    // Optimistic Update
    onMutate: async (input: SoftDeleteBlockInput) => {
      // 중복 호출 방지
      const normalizedIds = Array.isArray(input.blockMountIds)
        ? input.blockMountIds
        : [input.blockMountIds];
      const alreadyDeleting = normalizedIds.filter(id =>
        deletingBlockMountsRef.current.has(id)
      );

      if (alreadyDeleting.length > 0) {
        throw new Error('Already deleting these blocks');
      }

      // 삭제 시작 표시
      normalizedIds.forEach(id => deletingBlockMountsRef.current.add(id));

      // 노드 정규화 및 분리
      const nodeData = normalizeAndSeparateNodes(input.blockMountIds);

      if (nodeData.shouldReturn) {
        deletingBlockMountsRef.current.clear();
        throw new Error(nodeData.reason);
      }

      const { nodesToDelete, optimisticNodes, realNodes } = nodeData;

      // Optimistic 노드만 있는 경우 서버 호출 없이 UI에서만 제거
      if (realNodes.length === 0) {
        deleteElements({
          nodes: optimisticNodes.map(node => ({ id: node.id })),
        });
        deletingBlockMountsRef.current.clear();
        return { shouldSkipServerCall: true, previousNodes: getNodes() };
      }

      // 모든 노드를 UI에서 즉시 제거
      deleteElements({
        nodes: nodesToDelete.map(node => ({ id: node.id })),
      });

      // 롤백을 위한 컨텍스트 반환
      return {
        shouldSkipServerCall: false,
        previousNodes: getNodes(),
        realNodes,
        optimisticNodes,
        normalizedIds,
      };
    },

    // 자동 복원
    onError: (error, variables, context) => {
      // "Block mount not found" = 서버에 이미 없음 → 복원하지 않음
      // (router block resolve 등 레이스 시 삭제된 블록이 다시 나타나는 것 방지)
      const isNotFound =
        error instanceof Error &&
        error.message.toLowerCase().includes('block mount not found');
      if (isNotFound) {
        if (context?.normalizedIds) {
          context.normalizedIds.forEach(id =>
            deletingBlockMountsRef.current.delete(id)
          );
        }
        onError?.();
        return;
      }

      if (context?.previousNodes && !context.shouldSkipServerCall) {
        // Real 노드들만 복원 (optimistic 노드는 복원하지 않음)
        if (context.realNodes) {
          addNodes(context.realNodes);
        }
      }
      if (context?.normalizedIds) {
        context.normalizedIds.forEach(id =>
          deletingBlockMountsRef.current.delete(id)
        );
      }
      onError?.();
    },

    // 부분 실패 처리
    onSuccess: (result, variables, context) => {
      if (context?.shouldSkipServerCall) {
        onSuccess?.();
        return;
      }

      if (!context?.realNodes) {
        onSuccess?.();
        return;
      }

      // 성공한 ID들과 실패한 ID들 계산
      const successfulIds = result.deletedBlockMountIds;
      const realBlockMountIds = context.realNodes.map(node => node.id);
      const failedIds = realBlockMountIds.filter(
        id => !successfulIds.includes(id)
      );

      // 실패한 노드들만 복원 (성공한 것들은 이미 UI에서 제거됨)
      if (failedIds.length > 0) {
        const failedNodes = context.realNodes.filter(node =>
          failedIds.includes(node.id)
        );
        addNodes(failedNodes);
        console.warn(`Some blocks failed to delete: ${failedIds.join(', ')}`);
      }

      if (context.normalizedIds) {
        context.normalizedIds.forEach(id =>
          deletingBlockMountsRef.current.delete(id)
        );
      }

      onSuccess?.();
    },
  });

  return {
    softDeleteBlock: async (input: SoftDeleteBlockInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(input);
        return true;
      } catch (error) {
        return false;
      }
    },
    isDeleting: mutation.isPending,
  };
}
