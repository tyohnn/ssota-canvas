/**
 * Editor Panel Business Logic Hook
 *
 * 엔지니어가 배선하는 비즈니스 로직
 */

'use client';

import { useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { updateBlockTitleAction } from '@/domains/block-management/actions/block/update-block-title.action';
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
  const { workspaceId } = useCanvasMetadata();

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
      const currentTitle = (blockData.title as string) || '';

      // 변화가 없으면 업데이트하지 않음
      if (currentTitle.trim() === trimmedTitle) {
        return;
      }

      const blockIdValue = (blockData.blockId as string) || blockId;
      const blockMountId = blockData.blockMountId;

      try {
        // Optimistic update
        const originalTitle = blockData.title;
        const blockNode = getNode(blockMountId);

        // React Flow Store 즉시 업데이트 (node.id === blockMountId)
        const updatedData = {
          ...blockData,
          title: trimmedTitle,
        };

        if (blockNode) {
          updateNode(blockMountId, { data: updatedData });
        } else {
          console.warn(
            '[EditorPanel] Block node not found, skipping React Flow update'
          );
        }

        // Server action 호출 (UpdateBlockTitleRequestSchema: workspaceId, blockId, title)
        const result = await updateBlockTitleAction({
          workspaceId,
          blockId: blockIdValue,
          title: trimmedTitle,
        });

        if (!result.success) {
          // 실패 시 롤백
          console.error('[EditorPanel] Failed to update title:', result.error);
          if (blockNode) {
            updateNode(blockMountId, {
              data: { ...blockData, title: originalTitle },
            });
          }
          throw new Error(result.error || 'Failed to update title');
        }
      } catch (error) {
        console.error('[EditorPanel] Exception during title update:', error);
        throw error;
      }
    },
    [updateNode, getNode, workspaceId]
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
