'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { buildBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { duplicateBlocksAndMountAction } from '@/domains/canvas-management/actions/block-mount/duplicate-block-and-mount.action';
import { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import {
  type DuplicateBlockAndMountRequestInput,
  DuplicateBlockAndMountRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type { BlockDuplicatedAndMountedDTO } from '@/domains/canvas-management/shared/dtos/responses';
import type { Position } from '@/domains/canvas-management/shared/types/common.types';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getNodes: () => Node[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  addNodes: (nodes: Node[]) => void;
  deleteElements: (elements: { nodes: Array<{ id: string }> }) => void;
};

export type UseDuplicateBlocksParams = {
  reactFlow: ReactFlowDependencies;
  onSuccess?: (blockMountIds: string[]) => void;
  onError?: () => void;
};

export type DuplicateBlocksInput = {
  blocks: Array<{
    blockMountId: string;
    offsetX?: number;
    offsetY?: number;
  }>;
};

/** mutation 내부용: onMutate에서 생성한 ID를 mutationFn에서 동일하게 사용 */
type DuplicateBlocksMutationInput = DuplicateBlocksInput & {
  optimisticBlockMountIds: string[];
};

export type UseDuplicateBlocksResult = {
  duplicateBlocks: (input: DuplicateBlocksInput) => Promise<boolean>;
  isDuplicating: boolean;
};

/**
 * 블록 복제 도메인 훅 (TanStack Query Optimistic Update) - 다중
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 병렬 처리
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 * - 멀티 선택 모드로 자동 전환
 * - 부분 실패 처리
 */
export function useDuplicateBlocks(
  params: UseDuplicateBlocksParams
): UseDuplicateBlocksResult {
  const { reactFlow, onSuccess, onError } = params;
  const { getNodes, setNodes, addNodes, deleteElements } = reactFlow;

  /**
   * 고유한 Optimistic 노드 ID (단일 접두어, node.id = blockMountId)
   */
  const generateOptimisticNodeId = () => {
    return `optimistic-${crypto.randomUUID()}`;
  };

  /**
   * Optimistic 복제 노드 생성
   * 그룹 자식이면 parentId·parentBlockMountId 유지, position은 상대 좌표 유지
   * @param optimisticNodeId - node.id 및 data.blockMountId로 사용 (onMutate/mutationFn 일치용)
   */
  const createOptimisticDuplicateNode = (
    originalNode: Node,
    originalNodeData: BlockNodeData,
    offsetX: number,
    offsetY: number,
    optimisticNodeId: string
  ) => {
    const duplicatedPosition: Position = {
      x: originalNode.position.x + offsetX,
      y: originalNode.position.y + offsetY,
    };

    const baseNodeData = buildBlockNodeData(
      originalNodeData.blockType,
      {
        blockMountId: optimisticNodeId,
        blockId: optimisticNodeId,
        title: originalNodeData.title,
        properties: originalNodeData.properties,
        customProperties: originalNodeData.customProperties,
        content: originalNodeData.content,
        viewMode: originalNodeData.viewMode,
      }
    );

    const optimisticNodeData: BlockNodeData =
      originalNode.parentId != null
        ? {
            ...baseNodeData,
            parentBlockMountId: originalNode.parentId,
          }
        : baseNodeData;

    return {
      optimisticBlockMountId: optimisticNodeId,
      optimisticNodeData,
      duplicatedPosition,
      size: {
        width: originalNode.width || 200,
        height: originalNode.height || 150,
      },
      parentId: originalNode.parentId,
    };
  };

  const mutation = useMutation({
    mutationFn: async (
      input: DuplicateBlocksMutationInput
    ): Promise<{
      duplicateRequests: Array<{
        optimisticBlockMountId: string;
        originalNodeData: BlockNodeData;
        originalBlockType: BlockType;
      }>;
      results: Array<{
        status: 'fulfilled';
        value: {
          optimisticBlockMountId: string;
          result: BlockDuplicatedAndMountedDTO;
        };
      }>;
    }> => {
      if (input.blocks.length === 0) {
        throw new Error('No blocks to duplicate');
      }
      if (
        !input.optimisticBlockMountIds ||
        input.optimisticBlockMountIds.length !== input.blocks.length
      ) {
        throw new Error('optimisticBlockMountIds must match blocks length');
      }

      // 원본 블럭 정보 조회 (onMutate와 동일한 optimisticBlockMountIds 사용)
      const originalNodes = getNodes();
      const duplicateRequests: Array<{
        optimisticBlockMountId: string;
        request: DuplicateBlockAndMountRequestInput;
        originalNodeData: BlockNodeData;
        originalBlockType: BlockType;
      }> = [];

      for (let i = 0; i < input.blocks.length; i++) {
        const block = input.blocks[i]!;
        const optimisticBlockMountId = input.optimisticBlockMountIds[i]!;
        const originalNode = originalNodes.find(
          node =>
            (node.data as BlockNodeData).blockMountId === block.blockMountId
        );
        const originalNodeData = originalNode?.data as BlockNodeData;

        if (!originalNode) {
          console.error(
            `Original block not found for duplication: ${block.blockMountId}`
          );
          continue;
        }

        const rawRequest: DuplicateBlockAndMountRequestInput = {
          blockMountId: block.blockMountId,
          offsetX: block.offsetX || 20,
          offsetY: block.offsetY || 20,
        };
        const parseResult =
          DuplicateBlockAndMountRequestSchema.safeParse(rawRequest);
        if (!parseResult.success) {
          console.error('Invalid duplicate request:', parseResult.error);
          continue;
        }

        duplicateRequests.push({
          optimisticBlockMountId,
          request: parseResult.data,
          originalNodeData,
          originalBlockType: originalNodeData.blockType,
        });
      }

      if (duplicateRequests.length === 0) {
        throw new Error('No valid blocks to duplicate');
      }

      const actionResult = await duplicateBlocksAndMountAction({
        blocks: duplicateRequests.map(({ request }) => ({
          blockMountId: request.blockMountId,
          offsetX: request.offsetX,
          offsetY: request.offsetY,
        })),
      });
      if (isFailure(actionResult)) {
        throw new Error(actionResult.error);
      }
      const dtos = actionResult.data;

      const results = dtos.map((dto, index) => ({
        status: 'fulfilled' as const,
        value: {
          optimisticBlockMountId: duplicateRequests[index]!.optimisticBlockMountId,
          result: dto,
        },
      }));

      return {
        duplicateRequests,
        results,
      };
    },

    // Optimistic Update: 동일한 optimisticBlockMountIds를 mutationFn에 전달
    onMutate: async (input: DuplicateBlocksMutationInput) => {
      if (input.blocks.length === 0) {
        throw new Error('No blocks to duplicate');
      }
      if (
        !input.optimisticBlockMountIds ||
        input.optimisticBlockMountIds.length !== input.blocks.length
      ) {
        throw new Error('optimisticBlockMountIds must match blocks length');
      }

      const originalNodes = getNodes();
      const optimisticNodes: CustomNodeType[] = [];
      const duplicateRequests: Array<{
        optimisticBlockMountId: string;
        originalNodeData: BlockNodeData;
        originalBlockType: BlockType;
      }> = [];

      for (let i = 0; i < input.blocks.length; i++) {
        const block = input.blocks[i]!;
        const optimisticNodeId = input.optimisticBlockMountIds[i]!;
        const originalNode = originalNodes.find(
          node =>
            (node.data as BlockNodeData).blockMountId === block.blockMountId
        );
        const originalNodeData = originalNode?.data as BlockNodeData;

        if (!originalNode) {
          console.error(
            `Original block not found for duplication: ${block.blockMountId}`
          );
          continue;
        }

        const optimisticData = createOptimisticDuplicateNode(
          originalNode,
          originalNodeData,
          block.offsetX || 20,
          block.offsetY || 20,
          optimisticNodeId
        );

        const node: CustomNodeType = {
          id: optimisticData.optimisticBlockMountId,
          type: originalNodeData.blockType,
          position: optimisticData.duplicatedPosition,
          data: optimisticData.optimisticNodeData,
          width: optimisticData.size.width,
          height: optimisticData.size.height,
          zIndex: 1,
          draggable: false,
          ...(optimisticData.parentId != null && {
            parentId: optimisticData.parentId,
          }),
        } as CustomNodeType;

        optimisticNodes.push(node);
        duplicateRequests.push({
          optimisticBlockMountId: optimisticData.optimisticBlockMountId,
          originalNodeData,
          originalBlockType: originalNodeData.blockType,
        });
      }

      if (optimisticNodes.length === 0) {
        throw new Error('No valid blocks to duplicate');
      }

      addNodes(optimisticNodes);

      const optimisticBlockMountIds = optimisticNodes.map(n => n.id);
      setTimeout(() => {
        setNodes(
          (nodes: Node[]) =>
            nodes.map((node: Node) =>
              optimisticBlockMountIds.includes(node.id)
                ? { ...node, selected: true }
                : { ...node, selected: false }
            ) as Node[]
        );
      }, 100);

      return {
        optimisticBlockMountIds,
        previousNodes: getNodes(),
        duplicateRequests,
      };
    },

    // 자동 롤백
    onError: (error, variables, context) => {
      if (context?.optimisticBlockMountIds) {
        deleteElements({
          nodes: context.optimisticBlockMountIds.map(id => ({ id })),
        });
      }
      onError?.();
    },

    // 모든 Optimistic Node를 실제 Node로 교체
    onSuccess: (data, variables, context) => {
      if (!context?.optimisticBlockMountIds || !data.results) return;

      const actualBlockMountIds: string[] = [];

      // 각 결과 처리
      data.results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { optimisticBlockMountId, result: blockResult } = result.value;
          const duplicateRequest = context.duplicateRequests[index];

          if (!duplicateRequest || !blockResult) return;

          // Optimistic 노드에서 properties 가져오기
          const currentNodes = getNodes();
          const optimisticNode = currentNodes.find(
            node => node.id === optimisticBlockMountId
          );
          const optimisticNodeData = optimisticNode?.data as
            | BlockNodeData
            | undefined;

          // 실제 블럭 데이터 생성 (parentBlockMountId 유지)
          const realNodeData: BlockNodeData = buildBlockNodeData(
            duplicateRequest.originalBlockType,
            {
              blockMountId: blockResult.blockMountId,
              blockId: blockResult.blockId,
              title: optimisticNodeData?.title,
              properties: optimisticNodeData?.properties,
              customProperties: optimisticNodeData?.customProperties,
              content: optimisticNodeData?.content,
              viewMode: optimisticNodeData?.viewMode || 'original',
            }
          );
          const parentId = optimisticNode?.parentId;
          const parentBlockMountId = optimisticNodeData?.parentBlockMountId;

          // Optimistic 노드를 실제 노드로 교체 (parentId·parentBlockMountId 유지)
          setNodes(
            (nodes: Node[]) =>
              nodes.map((node: Node) => {
                if (node.id === optimisticBlockMountId) {
                  return {
                    ...node,
                    id: blockResult.blockMountId,
                    data: {
                      ...realNodeData,
                      ...(parentBlockMountId != null && {
                        parentBlockMountId,
                      }),
                    },
                    ...(parentId != null && { parentId }),
                    draggable: true,
                  } as CustomNodeType;
                }
                return node;
              }) as Node[]
          );

          actualBlockMountIds.push(blockResult.blockMountId);
        } else {
          // 실패한 경우 Optimistic 노드 제거
          const duplicateRequest = context.duplicateRequests[index];
          if (duplicateRequest) {
            deleteElements({
              nodes: [{ id: duplicateRequest.optimisticBlockMountId }],
            });
          }
        }
      });

      // 모든 실제 블럭이 준비되면 멀티 셀렉션 모드로 전환
      if (actualBlockMountIds.length > 0) {
        setTimeout(() => {
          setNodes(
            (nodes: Node[]) =>
              nodes.map((node: Node) =>
                actualBlockMountIds.includes(node.id)
                  ? { ...node, selected: true }
                  : { ...node, selected: false }
              ) as Node[]
          );
        }, 100);

        onSuccess?.(actualBlockMountIds);
      }
    },
  });

  return {
    duplicateBlocks: async (input: DuplicateBlocksInput): Promise<boolean> => {
      try {
        const optimisticBlockMountIds = input.blocks.map(() =>
          generateOptimisticNodeId()
        );
        await mutation.mutateAsync({
          blocks: input.blocks,
          optimisticBlockMountIds,
        });
        return true;
      } catch (error) {
        return false;
      }
    },
    isDuplicating: mutation.isPending,
  };
}
