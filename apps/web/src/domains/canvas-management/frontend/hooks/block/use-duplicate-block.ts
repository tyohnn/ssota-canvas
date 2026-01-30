'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { buildBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { duplicateBlockAndMountAction } from '@/domains/canvas-management/actions/block-mount/duplicate-block-and-mount.action';
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
  deleteElements: (
    elements:
      | { nodes: Array<{ id: string }> }
      | { edges: Array<{ id: string }> }
  ) => void;
};

export type UseDuplicateBlockParams = {
  reactFlow: ReactFlowDependencies;
  onSuccess?: (block: BlockDuplicatedAndMountedDTO) => void;
  onError?: () => void;
};

export type DuplicateBlockInput = {
  blockMountId: string;
  offsetX?: number;
  offsetY?: number;
};

export type UseDuplicateBlockResult = {
  duplicateBlock: (input: DuplicateBlockInput) => Promise<boolean>;
  isDuplicating: boolean;
};

/**
 * 블록 복제 도메인 훅 (TanStack Query Optimistic Update) - 단일
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 * - 복제된 블록 자동 선택 (단일 선택 모드)
 */
export function useDuplicateBlock(
  params: UseDuplicateBlockParams
): UseDuplicateBlockResult {
  const { reactFlow, onSuccess, onError } = params;
  const { getNodes, setNodes, addNodes, deleteElements } = reactFlow;

  /**
   * 고유한 Optimistic ID 생성
   */
  const generateOptimisticId = () => {
    return `optimistic-${crypto.randomUUID()}`;
  };

  /**
   * Optimistic 복제 노드 생성
   * 그룹 자식이면 parentId·parentBlockMountId 유지, position은 상대 좌표 유지
   */
  const createOptimisticDuplicateNode = (
    originalNode: Node,
    originalNodeData: BlockNodeData,
    offsetX: number,
    offsetY: number,
    optimisticId: string
  ) => {
    const optimisticBlockMountId = `optimistic-${optimisticId}`;
    const duplicatedPosition: Position = {
      x: originalNode.position.x + offsetX,
      y: originalNode.position.y + offsetY,
    };

    const baseNodeData = buildBlockNodeData(
      originalNodeData.blockType,
      {
        blockMountId: optimisticBlockMountId,
        blockId: optimisticId,
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
      optimisticBlockMountId,
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
    mutationFn: async (input: DuplicateBlockInput) => {
      // 원본 블럭 정보 조회
      const originalNodes = getNodes();
      const originalNode = originalNodes.find(
        node => (node.data as BlockNodeData).blockMountId === input.blockMountId
      );
      const originalNodeData = originalNode?.data as BlockNodeData;

      if (!originalNode) {
        throw new Error('Original block not found for duplication');
      }

      // Validation
      const rawRequest: DuplicateBlockAndMountRequestInput = {
        blockMountId: input.blockMountId,
        offsetX: input.offsetX || 20,
        offsetY: input.offsetY || 20,
      };

      const parseResult =
        DuplicateBlockAndMountRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid duplicate request');
      }

      // Server Action
      const result = await duplicateBlockAndMountAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return {
        result: result.data,
        originalNode,
        originalNodeData,
        originalBlockType: originalNodeData.blockType,
      };
    },

    // Optimistic Update
    onMutate: async (input: DuplicateBlockInput) => {
      // 원본 블럭 정보 조회
      const originalNodes = getNodes();
      const originalNode = originalNodes.find(
        node => (node.data as BlockNodeData).blockMountId === input.blockMountId
      );
      const originalNodeData = originalNode?.data as BlockNodeData;

      if (!originalNode) {
        throw new Error('Original block not found for duplication');
      }

      // Optimistic ID 생성
      const optimisticId = generateOptimisticId();

      // Optimistic 복제 노드 생성
      const optimisticData = createOptimisticDuplicateNode(
        originalNode,
        originalNodeData,
        input.offsetX || 20,
        input.offsetY || 20,
        optimisticId
      );

      // 노드 생성 (그룹 자식이면 parentId 유지)
      const optimisticNode: CustomNodeType = {
        id: optimisticData.optimisticBlockMountId,
        type: originalNodeData.blockType,
        position: optimisticData.duplicatedPosition,
        data: optimisticData.optimisticNodeData,
        width: optimisticData.size.width,
        height: optimisticData.size.height,
        zIndex: 1,
        ...(optimisticData.parentId != null && {
          parentId: optimisticData.parentId,
        }),
      } as CustomNodeType;

      // 즉시 React Flow Store에 추가 (맨 끝에 추가)
      addNodes([optimisticNode]);

      // 복제된 블럭을 자동으로 선택
      setTimeout(() => {
        setNodes(
          (nodes: Node[]) =>
            nodes.map((node: Node) =>
              node.id === optimisticData.optimisticBlockMountId
                ? { ...node, selected: true }
                : { ...node, selected: false }
            ) as Node[]
        );
      }, 100);

      // 롤백을 위한 컨텍스트 반환
      return {
        optimisticBlockMountId: optimisticData.optimisticBlockMountId,
        previousNodes: getNodes(),
      };
    },

    // 자동 롤백
    onError: (error, variables, context) => {
      if (context?.optimisticBlockMountId) {
        deleteElements({ nodes: [{ id: context.optimisticBlockMountId }] });
      }
      onError?.();
    },

    // Optimistic Node를 실제 Node로 교체
    onSuccess: (data, variables, context) => {
      if (!context?.optimisticBlockMountId || !data.result) return;

      const { result, originalBlockType } = data;

      // Optimistic 노드에서 properties 가져오기
      const currentNodes = getNodes();
      const optimisticNode = currentNodes.find(
        node => node.id === context.optimisticBlockMountId
      );
      const optimisticNodeData = optimisticNode?.data as
        | BlockNodeData
        | undefined;

      // 실제 블럭 데이터 생성
      const realNodeData: BlockNodeData = buildBlockNodeData(
        originalBlockType,
        {
          blockMountId: result.blockMountId,
          blockId: result.blockId,
          title: optimisticNodeData?.title,
          properties: optimisticNodeData?.properties,
          customProperties: optimisticNodeData?.customProperties,
          content: optimisticNodeData?.content,
          viewMode: optimisticNodeData?.viewMode || 'original',
        }
      );

      // Optimistic 노드를 실제 노드로 교체 (parentId·parentBlockMountId 유지)
      const parentId = optimisticNode?.parentId;
      const parentBlockMountId = (optimisticNode?.data as BlockNodeData)
        ?.parentBlockMountId;
      setNodes(
        (nodes: Node[]) =>
          nodes.map((node: Node) => {
            if (node.id === context.optimisticBlockMountId) {
              return {
                ...node,
                id: result.blockMountId,
                data: {
                  ...realNodeData,
                  ...(parentBlockMountId != null && {
                    parentBlockMountId,
                  }),
                },
                ...(parentId != null && { parentId }),
              } as CustomNodeType;
            }
            return node;
          }) as Node[]
      );

      // 실제 블럭으로 선택 상태 업데이트 (단일 선택 모드)
      setTimeout(() => {
        setNodes(
          (nodes: Node[]) =>
            nodes.map((node: Node) =>
              node.id === result.blockMountId
                ? { ...node, selected: true }
                : { ...node, selected: false }
            ) as Node[]
        );
      }, 100);

      onSuccess?.(result);
    },
  });

  return {
    duplicateBlock: async (input: DuplicateBlockInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(input);
        return true;
      } catch (error) {
        return false;
      }
    },
    isDuplicating: mutation.isPending,
  };
}
