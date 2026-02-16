'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import type { CanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { isFailure } from '@/lib';

import { updateBlockTitleAction } from '../../../actions/block/update-block-title.action';
import {
  type UpdateBlockTitleRequestInput,
  UpdateBlockTitleRequestSchema,
} from '../../../shared/dtos/requests';
import { BlockNodeData } from '../../../shared/types/block-data.types';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
};

export type UseUpdateBlockTitleParams = {
  reactFlow: ReactFlowDependencies;
  /** 테스트 시 mock 주입용. 미제공 시 useCanvasMetadata() 사용 */
  canvasMetadata?: CanvasMetadata;
};

export type UpdateBlockTitleInput = {
  nodeId: string; // React Flow node id (blockMountId)
  title: string;
  blockData: BlockNodeData;
};

export type UseUpdateBlockTitleResult = {
  updateBlockTitle: (input: UpdateBlockTitleInput) => Promise<boolean>;
  isUpdating: boolean;
};

/**
 * 블록 제목 업데이트 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 *
 * block.title 컬럼을 업데이트
 */
export function useUpdateBlockTitle(
  params: UseUpdateBlockTitleParams
): UseUpdateBlockTitleResult {
  const { reactFlow, canvasMetadata: canvasMetadataOverride } = params;
  const { updateNode, getNode } = reactFlow;
  const canvasMetadata = canvasMetadataOverride ?? useCanvasMetadata();
  const { workspaceId } = canvasMetadata;

  const mutation = useMutation({
    mutationFn: async ({ nodeId, title, blockData }: UpdateBlockTitleInput) => {
      if (!workspaceId) throw new Error('Workspace context required');
      // Validation
      const rawRequest: UpdateBlockTitleRequestInput = {
        workspaceId,
        blockId: blockData.blockId,
        title,
      };

      const parseResult = UpdateBlockTitleRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid title update data');
      }

      // Server Action
      const result = await updateBlockTitleAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async ({ nodeId, title, blockData }) => {
      const latestNode = getNode(nodeId);
      const currentData = (latestNode?.data as BlockNodeData) || blockData;

      const updatedData = { ...currentData, title };
      updateNode(nodeId, { data: updatedData });

      // 롤백을 위한 컨텍스트 반환
      return { previousData: currentData, nodeId };
    },

    // 자동 롤백
    onError: (error, variables, context) => {
      if (context?.previousData && context?.nodeId) {
        updateNode(context.nodeId, { data: context.previousData });
      }
    },
  });

  return {
    updateBlockTitle: async (
      input: UpdateBlockTitleInput
    ): Promise<boolean> => {
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
