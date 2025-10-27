'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { updateBlockPropertyAction } from '../../actions/block.actions';
import { isFailure } from '@/lib/action-result';

export interface UseBlockPropertyUpdateResult {
  updateProperty: <T>(
    blockId: string,
    propertyPath: string,
    value: T
  ) => Promise<void>;
}

/**
 * 블록 속성 업데이트 Hook (Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트
 * - Server Action 백그라운드 동기화
 * - 실패 시 롤백
 */
export function useBlockPropertyUpdate(): UseBlockPropertyUpdateResult {
  const { getNode, updateNode } = useReactFlow();

  const updateProperty = useCallback(
    async <T>(
      blockId: string,
      propertyPath: string,
      value: T
    ): Promise<void> => {
      // 1. 현재 노드 가져오기
      const currentNode = getNode(blockId);
      if (!currentNode) {
        console.warn('Node not found:', blockId);
        return;
      }

      // 2. 원본 데이터 백업 (롤백용)
      const originalData = currentNode.data;

      // 3. Optimistic Update: React Flow Store 즉시 업데이트
      const updatedData = { ...currentNode.data };
      const pathParts = propertyPath.split('.');

      // 중첩된 객체 경로 처리
      let current: any = updatedData;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (part && !current[part]) {
          current[part] = {};
        }
        if (part) {
          current = current[part];
        }
      }
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart) {
        current[lastPart] = value;
      }

      updateNode(blockId, { data: updatedData });

      try {
        // 4. Server Action 호출 (비동기)
        const result = await updateBlockPropertyAction({
          blockId: currentNode.data.blockId as string,
          propertyPath,
          value,
          pageId: currentNode.data.pageId as string | undefined,
          orgId: currentNode.data.orgId as string | undefined,
          workspaceId: currentNode.data.workspaceId as string | undefined,
        });

        if (isFailure(result)) {
          // 실패 시 롤백
          updateNode(blockId, { data: originalData });
          console.error('Failed to update block property:', result.error);
        }
      } catch (error) {
        // 에러 시 롤백
        updateNode(blockId, { data: originalData });
        console.error('Error updating block property:', error);
      }
    },
    [getNode, updateNode]
  );

  return {
    updateProperty,
  };
}
