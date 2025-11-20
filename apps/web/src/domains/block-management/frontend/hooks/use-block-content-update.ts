'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { updateBlockContentAction } from '../../actions/block.actions';
import { isFailure } from '@/lib/action-result';
import {
  UpdateBlockContentRequestSchema,
  type UpdateBlockContentRequestInput,
} from '../../shared/dtos/requests';
import { BlockNodeData } from '../../shared/types/block-data.types';

export interface UseBlockContentUpdateResult {
  updateContent: (
    nodeId: string, // React Flow node id (blockMountId)
    content: unknown,
    blockData: BlockNodeData,
    contentRaw?: string // Markdown text (optional, for AI context)
  ) => Promise<void>;
  updateContentImmediate: (
    nodeId: string, // React Flow node id (blockMountId)
    content: unknown,
    blockData: BlockNodeData
  ) => void;
}

/**
 * 블록 콘텐츠 업데이트 Hook (Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트
 * - Server Action 백그라운드 동기화
 * - 실패 시 롤백
 *
 * block.content JSONB 컬럼을 업데이트 (TipTap JSON, 기타 구조화된 콘텐츠)
 */
export function useBlockContentUpdate(): UseBlockContentUpdateResult {
  const { updateNode } = useReactFlow();

  const updateContent = useCallback(
    async (
      nodeId: string, // React Flow node id (blockMountId)
      content: unknown,
      blockData: BlockNodeData,
      contentRaw?: string // Markdown text (optional)
    ): Promise<void> => {
      console.log('[useBlockContentUpdate] updateContent called', {
        nodeId,
        blockId: blockData.blockId,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
        contentPreview: JSON.stringify(content).slice(0, 100),
        hasContentRaw: !!contentRaw,
      });

      // 1. 원본 데이터 백업 (롤백용)
      const originalData = blockData;

      // 2. Optimistic Update: React Flow Store 즉시 업데이트
      const updatedData = { ...blockData, content };
      updateNode(nodeId, { data: updatedData });
      console.log(
        '[useBlockContentUpdate] Optimistic update applied to node:',
        nodeId
      );

      try {
        // 3. workspaceId와 orgId 확인
        if (!blockData.workspaceId || !blockData.orgId) {
          console.error(
            '[useBlockContentUpdate] Missing workspaceId or orgId',
            {
              blockData,
              nodeId,
            }
          );
          updateNode(nodeId, { data: originalData });
          return;
        }

        // 4. 프론트엔드 검증 (UX 최적화)
        const rawRequest: UpdateBlockContentRequestInput = {
          blockId: blockData.blockId,
          content,
          contentRaw, // Markdown text (optional)
          workspaceId: blockData.workspaceId,
          orgId: blockData.orgId,
        };

        console.log('[useBlockContentUpdate] Validating request:', rawRequest);

        const parseResult =
          UpdateBlockContentRequestSchema.safeParse(rawRequest);
        if (!parseResult.success) {
          // 검증 실패 시 롤백
          updateNode(nodeId, { data: originalData });
          const firstError = parseResult.error.issues[0];
          console.error('[useBlockContentUpdate] Validation failed:', {
            message: firstError?.message || 'Invalid content update data',
            issues: parseResult.error.issues,
          });
          return;
        }

        console.log('[useBlockContentUpdate] Calling server action...');

        // 5. Server Action 호출 (검증된 데이터)
        const result = await updateBlockContentAction(parseResult.data);

        if (isFailure(result)) {
          // 실패 시 롤백
          updateNode(nodeId, { data: originalData });
          console.error(
            '[useBlockContentUpdate] Server action failed:',
            result.error
          );
        } else {
          console.log('[useBlockContentUpdate] Server action succeeded');
        }
      } catch (error) {
        // 에러 시 롤백
        updateNode(nodeId, { data: originalData });
        console.error('[useBlockContentUpdate] Error:', error);
      }
    },
    [updateNode]
  );

  const updateContentImmediate = useCallback(
    (
      nodeId: string, // React Flow node id (blockMountId)
      content: unknown,
      blockData: BlockNodeData
    ): void => {
      // 1. workspaceId와 orgId 확인
      if (!blockData.workspaceId || !blockData.orgId) {
        console.error('Missing workspaceId or orgId in blockData');
        return;
      }

      // 2. 프론트엔드 검증 (데이터 무결성)
      const rawRequest: UpdateBlockContentRequestInput = {
        blockId: blockData.blockId,
        content,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
      };

      const parseResult = UpdateBlockContentRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error(
          '[Frontend Validation] Invalid immediate content update data:',
          {
            message: firstError?.message || 'Invalid content update data',
            issues: parseResult.error.issues,
          }
        );
        // TODO: toast.error로 사용자에게 피드백
        return;
      }

      // 3. Optimistic Update: React Flow Store 즉시 업데이트
      const updatedData = { ...blockData, content };
      updateNode(nodeId, { data: updatedData });
    },
    [updateNode]
  );

  return {
    updateContent,
    updateContentImmediate,
  };
}
