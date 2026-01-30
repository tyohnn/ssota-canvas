'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { buildBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { getDefaultViewMode } from '@/domains/block-management/shared/types/block-view-modes';
import {
  BlockType,
  getBlockSize,
  getBlockSizeForViewMode,
} from '@/domains/block-management/shared/types/block-types';
import { isFailure } from '@/lib';

import { createAndMountBlockAction } from '../../../actions/block-mount/create-and-mount-block.action';
import { softDeleteBlockMountAction } from '../../../actions/block-mount/soft-delete-block-mount.action';
import {
  type CreateAndMountBlockRequestInput,
  CreateAndMountBlockRequestSchema,
  type SoftDeleteBlockMountRequestInput,
  SoftDeleteBlockMountRequestSchema,
} from '../../../shared/dtos/requests';
import type { BlockCreatedAndMountedDTO } from '../../../shared/dtos/responses';
import type { Position } from '../../../shared/types/common.types';
import { CustomNodeType } from '../../acl/react-flow.acl';

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
  viewMode?: 'note' | 'original' | 'card'; // 초기 viewMode (선택적, 기본값: original)
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
    viewMode: 'note' | 'original' | 'card' = getDefaultViewMode(blockType),
    initialProperties?: Record<string, any>,
    initialContent?: unknown,
    title?: string
  ): CustomNodeType => {
    // viewMode에 따른 크기 결정
    const blockSize = getBlockSizeForViewMode(blockType, viewMode);
    const optimisticNodeData: BlockNodeData = buildBlockNodeData(blockType, {
      blockMountId: '',
      blockId: '',
      properties: initialProperties,
      content: initialContent,
      title,
      viewMode,
    });

    // sizes 초기화
    const sizes = {
      [viewMode]: {
        width: blockSize.width,
        height: blockSize.height,
      },
    };

    return {
      id: optimisticId,
      type: blockType,
      position,
      data: {
        ...optimisticNodeData,
        sizes, // sizes 추가
      },
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
        return false;
      }

      const rollbackResult = await softDeleteBlockMountAction(parseResult.data);

      if (rollbackResult.success) {
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  };

  const mutation = useMutation({
    mutationFn: async (input: CreateBlockInput) => {
      // viewMode 결정: input에서 제공되면 사용, 없으면 blockType에 따른 기본값 사용
      // 마크다운 블록은 'note'가 기본값, 다른 블록은 'original'이 기본값
      const viewMode = input.viewMode || getDefaultViewMode(input.blockType);
      // viewMode에 따른 크기 결정
      const blockSize = getBlockSizeForViewMode(input.blockType, viewMode);

      // Validation
      const rawRequest: CreateAndMountBlockRequestInput = {
        pageId,
        blockType: input.blockType,
        position: input.position,
        size: blockSize,
        // viewMode는 input에서 제공된 경우에만 전달 (undefined면 전달하지 않음)
        ...(input.viewMode && { viewMode: input.viewMode }),
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
      // viewMode 결정: input에서 제공되면 사용, 없으면 blockType에 따른 기본값 사용
      const viewMode = input.viewMode || getDefaultViewMode(input.blockType);
      const optimisticId = generateOptimisticId();
      const optimisticNode = createOptimisticNode(
        input.blockType,
        input.position,
        optimisticId,
        viewMode,
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
          title: blockView.title,
          properties: blockView.properties,
          customProperties: blockView.customProperties,
          content: blockView.content,
          viewMode: blockView.viewMode,
          sizes: blockView.viewModeSizes, // sizes 추가
          createdByProfile: blockView.createdByProfile,
          createdAt: blockView.createdAt,
          updatedAt: blockView.updatedAt,
        }
      );

      // optimistic 노드를 실제 노드로 업데이트 (ID 변경 포함)
      setNodes(
        (nodes: Node[]) => {
          const updatedNodes = nodes.map((node: Node) =>
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
          ) as Node[];

          return updatedNodes;
        }
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
