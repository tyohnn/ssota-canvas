/**
 * Editor Panel Business Logic Hook
 *
 * 엔지니어가 배선하는 비즈니스 로직
 */

'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { updateBlockTitleAction } from '@/domains/block-management/actions/block.actions';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface EditorPanelBusinessLogic {
  onTitleSave: (params: {
    blockId: string;
    title: string;
    blockData: BlockNodeData;
  }) => Promise<void>;
  onClose: () => void;
}

/**
 * Production 비즈니스 로직
 */
export function useEditorPanelBusiness(
  onClose: () => void
): EditorPanelBusinessLogic {
  const { updateNode, getNode } = useReactFlow();

  const onTitleSave = useCallback(
    async ({
      blockId,
      title,
      blockData,
    }: {
      blockId: string;
      title: string;
      blockData: BlockNodeData;
    }) => {
      if (!title.trim()) {
        return;
      }

      const trimmedTitle = title.trim();
      const blockIdValue = (blockData.blockId as string) || blockId;

      try {
        // Optimistic update
        const originalTitle = blockData.title;
        const blockNode = getNode(blockId);

        // React Flow Store 즉시 업데이트
        const updatedData = {
          ...blockData,
          title: trimmedTitle,
        };

        if (blockNode) {
          updateNode(blockId, { data: updatedData });
        }

        // Validation
        if (!blockData.workspaceId || !blockData.orgId) {
          console.error('Missing workspaceId or orgId in blockData');
          return;
        }

        // Server action 호출
        const result = await updateBlockTitleAction({
          blockId: blockIdValue,
          title: trimmedTitle,
          workspaceId: blockData.workspaceId,
          orgId: blockData.orgId,
        });

        if (!result.success) {
          // 실패 시 롤백
          if (blockNode) {
            updateNode(blockId, {
              data: { ...blockData, title: originalTitle },
            });
          }
          console.error('Failed to update title:', result.error);
          throw new Error(result.error || 'Failed to update title');
        }
      } catch (error) {
        console.error('Failed to update title:', error);
        throw error;
      }
    },
    [updateNode, getNode]
  );

  return {
    onTitleSave,
    onClose,
  };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 */
export function useMockEditorPanelBusiness(
  onClose: () => void
): EditorPanelBusinessLogic {
  const onTitleSave = useCallback(async ({ title }: { title: string }) => {
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  return {
    onTitleSave,
    onClose,
  };
}
