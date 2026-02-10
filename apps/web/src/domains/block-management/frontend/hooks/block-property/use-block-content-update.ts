'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { isFailure } from '@/lib';

import { updateBlockContentAction } from '../../../actions/block/update-block-content.action';
import {
  type UpdateBlockContentRequestInput,
  UpdateBlockContentRequestSchema,
} from '../../../shared/dtos/requests';
import { BlockNodeData } from '../../../shared/types/block-data.types';
import { useCanvasHistory } from '@/domains/canvas-management/frontend/history';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
};

export type UseUpdateBlockContentParams = {
  reactFlow: ReactFlowDependencies;
};

export type UpdateBlockContentInput = {
  nodeId: string; // React Flow node id (blockMountId)
  content: unknown;
  blockData: BlockNodeData;
  contentRaw?: string; // Markdown text (optional, for AI context)
};

export type UseUpdateBlockContentResult = {
  updateBlockContent: (input: UpdateBlockContentInput) => Promise<boolean>;
  isUpdating: boolean;
};

/**
 * 블록 콘텐츠 업데이트 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 * - 히스토리 기록 (Undo/Redo 지원)
 *
 * block.content JSONB 컬럼을 업데이트 (TipTap JSON, 기타 구조화된 콘텐츠)
 */
export function useUpdateBlockContent(
  params: UseUpdateBlockContentParams
): UseUpdateBlockContentResult {
  const { reactFlow } = params;
  const { updateNode, getNode } = reactFlow;
  const history = useCanvasHistory();

  const mutation = useMutation({
    mutationFn: async ({
      nodeId,
      content,
      blockData,
      contentRaw,
    }: UpdateBlockContentInput) => {
      // Validation
      const rawRequest: UpdateBlockContentRequestInput = {
        blockId: blockData.blockId,
        content,
        contentRaw, // Markdown text (optional)
      };

      const parseResult = UpdateBlockContentRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid content update data');
      }

      // Server Action
      const result = await updateBlockContentAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async ({ nodeId, content, blockData }) => {
      const latestNode = getNode(nodeId);
      const currentData = (latestNode?.data as BlockNodeData) || blockData;

      const updatedData = { ...currentData, content };
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

    // 성공 시 히스토리 기록
    onSuccess: (data, variables, context) => {
      if (!context?.previousData || !context?.nodeId) return;
      
      const { nodeId, content, blockData } = variables;

      // 1. 언두/리두 중이거나 스킵 모드이면 기록하지 않음
      if (history.getIsSkipping?.()) {
        console.log('[BlockContent] Skipping history record due to skipping state');
        return;
      }

      // 2. 노드 존재 여부 확인 (Undo로 삭제된 노드의 좀비 업데이트 방지)
      // getNode가 없거나, getNode(id)가 undefined를 반환하면 노드가 없는 것
      const currentNode = getNode(nodeId);
      if (!currentNode) {
         console.log('[BlockContent] Node physically removed, skipping zombie history record:', nodeId);
         return;
      }

      const previousContent = context.previousData.content;

      // 콘텐츠가 실제로 변경된 경우에만 히스토리 기록
      if (JSON.stringify(previousContent) !== JSON.stringify(content)) {
        console.log('[BlockContent] Content updated, recording to history:', nodeId);
        history.recordOperation({
          type: 'BLOCK_CONTENT_UPDATE',
          blockMountId: nodeId,
          data: {
            blockId: blockData.blockId,
            previousContent,
            newContent: content,
          },
        });
      }
    },
  });

  return {
    updateBlockContent: async (
      input: UpdateBlockContentInput
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
