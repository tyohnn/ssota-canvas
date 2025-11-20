'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { updateBlockTitleAction } from '../../actions/block.actions';
import { isFailure } from '@/lib/action-result';
import {
  UpdateBlockTitleRequestSchema,
  type UpdateBlockTitleRequestInput,
} from '../../shared/dtos/requests';
import { BlockNodeData } from '../../shared/types/block-data.types';

export interface UseBlockTitleUpdateResult {
  updateTitle: (
    nodeId: string, // React Flow node id (blockMountId)
    title: string,
    blockData: BlockNodeData
  ) => Promise<void>;
  updateTitleImmediate: (
    nodeId: string, // React Flow node id (blockMountId)
    title: string,
    blockData: BlockNodeData
  ) => void;
}

/**
 * 블록 제목 업데이트 Hook (Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트
 * - Server Action 백그라운드 동기화
 * - 실패 시 롤백
 *
 * block.title 컬럼을 업데이트
 */
export function useBlockTitleUpdate(): UseBlockTitleUpdateResult {
  const { updateNode } = useReactFlow();

  const updateTitle = useCallback(
    async (
      nodeId: string, // React Flow node id (blockMountId)
      title: string,
      blockData: BlockNodeData
    ): Promise<void> => {
      console.log('[useBlockTitleUpdate] updateTitle called', {
        nodeId,
        blockId: blockData.blockId,
        title,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
      });

      // 1. 원본 데이터 백업 (롤백용)
      const originalTitle = blockData.title;

      // 2. Optimistic Update: React Flow Store 즉시 업데이트
      const updatedData = { ...blockData, title };
      updateNode(nodeId, { data: updatedData });
      console.log('[useBlockTitleUpdate] Optimistic update applied to node');

      // 3. 서버 액션 호출
      try {
        // workspaceId와 orgId 확인
        if (!blockData.workspaceId || !blockData.orgId) {
          throw new Error('Missing workspaceId or orgId in blockData');
        }

        // 프론트엔드 검증 (데이터 무결성)
        const rawRequest: UpdateBlockTitleRequestInput = {
          blockId: blockData.blockId, // 실제 blockId 사용
          title,
          workspaceId: blockData.workspaceId,
          orgId: blockData.orgId,
        };

        const parseResult = UpdateBlockTitleRequestSchema.safeParse(rawRequest);
        if (!parseResult.success) {
          const firstError = parseResult.error.issues[0];
          console.error('[Frontend Validation] Invalid title update data:', {
            message: firstError?.message || 'Invalid title update data',
            issues: parseResult.error.issues,
          });
          throw new Error(firstError?.message || 'Invalid title update data');
        }

        // Server Action 호출
        const result = await updateBlockTitleAction(parseResult.data);

        if (isFailure(result)) {
          console.error(
            '[useBlockTitleUpdate] Server action failed:',
            result.error
          );
          // 4. 실패 시 롤백
          const rollbackData = { ...blockData, title: originalTitle };
          updateNode(nodeId, { data: rollbackData });
          throw new Error(result.error);
        }

        console.log(
          '[useBlockTitleUpdate] Title successfully updated on server'
        );
      } catch (error) {
        console.error('[useBlockTitleUpdate] Error:', error);
        // 롤백
        const rollbackData = { ...blockData, title: originalTitle };
        updateNode(nodeId, { data: rollbackData });
        throw error;
      }
    },
    [updateNode]
  );

  const updateTitleImmediate = useCallback(
    (
      nodeId: string, // React Flow node id (blockMountId)
      title: string,
      blockData: BlockNodeData
    ): void => {
      // 1. workspaceId와 orgId 확인
      if (!blockData.workspaceId || !blockData.orgId) {
        console.error('Missing workspaceId or orgId in blockData');
        return;
      }

      // 2. 프론트엔드 검증 (데이터 무결성)
      const rawRequest: UpdateBlockTitleRequestInput = {
        blockId: blockData.blockId,
        title,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
      };

      const parseResult = UpdateBlockTitleRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error(
          '[Frontend Validation] Invalid immediate title update data:',
          {
            message: firstError?.message || 'Invalid title update data',
            issues: parseResult.error.issues,
          }
        );
        return;
      }

      // 3. Optimistic Update: React Flow Store 즉시 업데이트
      const updatedData = { ...blockData, title };
      updateNode(nodeId, { data: updatedData });
    },
    [updateNode]
  );

  return {
    updateTitle,
    updateTitleImmediate,
  };
}
