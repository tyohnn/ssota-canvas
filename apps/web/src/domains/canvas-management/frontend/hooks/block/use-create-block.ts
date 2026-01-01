'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { buildBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  BlockType,
  getBlockSize,
} from '@/domains/block-management/shared/types/block-types';
import { createAndMountBlockAction } from '@/domains/canvas-management/actions/block/create-and-mount-block.action';
import { softDeleteBlockMountAction } from '@/domains/canvas-management/actions/block/soft-delete-block-mount.action';
import { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import {
  type CreateAndMountBlockRequestInput,
  CreateAndMountBlockRequestSchema,
  type SoftDeleteBlockMountRequestInput,
  SoftDeleteBlockMountRequestSchema,
} from '@/domains/canvas-management/shared/dtos/requests';
import type {
  BlockCreatedAndMountedDTO,
  BlockMountSoftDeletedDTO,
} from '@/domains/canvas-management/shared/dtos/responses';
import type { Position } from '@/domains/canvas-management/shared/types/common.types';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getNodes: () => Node[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  addNodes: (nodes: Node[]) => void;
  deleteElements: (elements: { nodes: Array<{ id: string }> }) => void;
};

export type UseCreateBlockParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
  onSuccess?: (block: BlockCreatedAndMountedDTO) => void;
  onError?: () => void;
};

export type CreateBlockInput = {
  blockType: BlockType;
  position: Position;
  initialProperties?: Record<string, any>;
  initialContent?: unknown;
  title?: string;
};

export type UseCreateBlockResult = {
  createBlock: (
    input: CreateBlockInput
  ) => Promise<BlockCreatedAndMountedDTO | null>;
  isCreating: boolean;
};

/**
 * 블록 생성 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 * - 사용자가 Optimistic Node를 삭제한 경우: 서버 생성 후 즉시 삭제 (rollback)
 */
export function useCreateBlock(
  params: UseCreateBlockParams
): UseCreateBlockResult {
  const { pageId, reactFlow, onSuccess, onError } = params;
  const { getNodes, setNodes, addNodes, deleteElements } = reactFlow;

  /**
   * 고유한 Optimistic ID 생성
   */
  const generateOptimisticId = () => {
    return `optimistic-${crypto.randomUUID()}`;
  };

  /**
   * Optimistic 노드 생성
   */
  const createOptimisticNode = (
    blockType: BlockType,
    position: Position,
    optimisticId: string,
    initialProperties?: Record<string, any>,
    initialContent?: unknown,
    title?: string
  ): CustomNodeType => {
    const blockSize = getBlockSize(blockType);
    const optimisticNodeData: BlockNodeData = buildBlockNodeData(blockType, {
      blockMountId: '',
      blockId: '',
      pageId,
      orgId: '', // Optimistic node - will be replaced by server response
      workspaceId: '', // Optimistic node - will be replaced by server response
      properties: initialProperties,
      content: initialContent,
      title,
    });

    return {
      id: optimisticId,
      type: blockType,
      position,
      data: optimisticNodeData,
      width: blockSize.width,
      height: blockSize.height,
      zIndex: 1,
    } as CustomNodeType;
  };

  /**
   * Optimistic 노드가 삭제된 경우 서버에서 생성된 블록을 삭제
   */
  const deleteCreatedBlockWhenOptimisticDeleted = async (
    blockMountId: string
  ): Promise<boolean> => {
    try {
      const rollbackRequest: SoftDeleteBlockMountRequestInput = {
        blockMountIds: [blockMountId],
        pageId: pageId,
      };

      const parseResult =
        SoftDeleteBlockMountRequestSchema.safeParse(rollbackRequest);

      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error('[Rollback Validation] Invalid delete request:', {
          message: firstError?.message || 'Invalid rollback request',
          issues: parseResult.error.issues,
        });
        return false;
      }

      const rollbackResult = await softDeleteBlockMountAction(parseResult.data);

      if (rollbackResult.success) {
        return true;
      } else {
        console.error(
          '❌ Block creation rollback failed:',
          rollbackResult.error
        );
        return false;
      }
    } catch (rollbackError) {
      console.error('Failed to rollback block creation:', rollbackError);
      return false;
    }
  };

  const mutation = useMutation({
    mutationFn: async (input: CreateBlockInput) => {
      // Validation
      const rawRequest: CreateAndMountBlockRequestInput = {
        pageId,
        blockType: input.blockType,
        position: input.position,
        size: getBlockSize(input.blockType),
        title: input.title,
        initialProperties: input.initialProperties,
        initialContent: input.initialContent,
      };

      const parseResult =
        CreateAndMountBlockRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid block data');
      }

      // Server Action
      const result = await createAndMountBlockAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async (input: CreateBlockInput) => {
      const optimisticId = generateOptimisticId();
      const optimisticNode = createOptimisticNode(
        input.blockType,
        input.position,
        optimisticId,
        input.initialProperties,
        input.initialContent,
        input.title
      );

      // 즉시 React Flow Store에 추가
      addNodes([optimisticNode]);

      // 롤백을 위한 컨텍스트 반환
      return { optimisticId, previousNodes: getNodes() };
    },

    // 자동 롤백
    onError: (error, variables, context) => {
      if (context?.optimisticId) {
        deleteElements({ nodes: [{ id: context.optimisticId }] });
      }
      onError?.();
    },

    // Optimistic Node를 실제 Node로 교체
    onSuccess: async (blockView, variables, context) => {
      if (!context?.optimisticId) return;

      const currentNodes = getNodes();
      const optimisticNodeStillExists = currentNodes.some(
        node => node.id === context.optimisticId
      );

      if (!optimisticNodeStillExists) {
        // 사용자가 optimistic 노드를 삭제했음 → 서버에서 soft delete 처리
        await deleteCreatedBlockWhenOptimisticDeleted(blockView.blockMountId);
        onError?.();
        return;
      }

      // optimistic 노드가 존재함 → 실제 데이터로 업데이트 (깜빡임 방지)
      // Note: orgId, workspaceId는 BlockNodeData에 필요하지만 서버 응답에 포함되지 않음
      // pageId로부터 조회하거나, 기존 optimistic node의 값을 유지
      const optimisticNode = currentNodes.find(
        node => node.id === context.optimisticId
      );
      const optimisticNodeData = optimisticNode?.data as
        | BlockNodeData
        | undefined;

      const realNodeData: BlockNodeData = buildBlockNodeData(
        blockView.blockType,
        {
          blockMountId: blockView.blockMountId,
          blockId: blockView.blockId,
          pageId,
          orgId: optimisticNodeData?.orgId || '', // Keep from optimistic or empty
          workspaceId: optimisticNodeData?.workspaceId || '', // Keep from optimistic or empty
          title: blockView.title,
          properties: blockView.properties,
          customProperties: blockView.customProperties,
          content: blockView.content,
          createdByProfile: blockView.createdByProfile,
          createdAt: blockView.createdAt,
          updatedAt: blockView.updatedAt,
        }
      );

      // optimistic 노드를 실제 노드로 업데이트 (ID 변경 포함)
      setNodes(
        (nodes: Node[]) =>
          nodes.map((node: Node) =>
            node.id === context.optimisticId
              ? ({
                  ...node,
                  id: blockView.blockMountId,
                  type: blockView.blockType,
                  position: blockView.position,
                  data: realNodeData,
                  width: blockView.size.width,
                  height: blockView.size.height,
                  zIndex: blockView.zOrder,
                } as CustomNodeType)
              : node
          ) as Node[]
      );

      onSuccess?.(blockView);
    },
  });

  return {
    createBlock: async (
      input: CreateBlockInput
    ): Promise<BlockCreatedAndMountedDTO | null> => {
      try {
        return await mutation.mutateAsync(input);
      } catch (error) {
        return null;
      }
    },
    isCreating: mutation.isPending,
  };
}
