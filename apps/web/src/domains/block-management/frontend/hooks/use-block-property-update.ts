'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { updateBlockPropertyAction } from '../../actions/block.actions';
import { isFailure } from '@/lib/action-result';
import {
  UpdateBlockPropertyRequestSchema,
  type UpdateBlockPropertyRequestInput,
} from '../../shared/dtos/requests';
import { BlockNodeData } from '../../shared/types/block-data.types';

export interface UseBlockPropertyUpdateResult {
  updateProperty: <T>(
    blockId: string,
    propertyPath: string,
    value: T,
    blockData: BlockNodeData
  ) => Promise<void>;
  updatePropertyImmediate: <T>(
    blockId: string,
    propertyPath: string,
    value: T,
    blockData: BlockNodeData
  ) => void;
}

/**
 * 블록 속성 업데이트 Hook (Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트
 * - Server Action 백그라운드 동기화
 * - 실패 시 롤백
 */
export function useBlockPropertyUpdate(): UseBlockPropertyUpdateResult {
  const { updateNode } = useReactFlow();

  // 중첩된 객체 경로 처리 유틸리티 함수
  const updateNestedProperty = useCallback(
    <T>(data: BlockNodeData, propertyPath: string, value: T) => {
      const updatedData = { ...data };
      const pathParts = propertyPath.split('.');

      let current = updatedData;
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

      return updatedData;
    },
    []
  );

  const updateProperty = useCallback(
    async <T>(
      blockId: string,
      propertyPath: string,
      value: T,
      blockData: BlockNodeData
    ): Promise<void> => {
      // 1. 원본 데이터 백업 (롤백용)
      const originalData = blockData;

      // 2. Optimistic Update: React Flow Store 즉시 업데이트
      const updatedData = updateNestedProperty<T>(
        blockData,
        propertyPath,
        value
      );
      updateNode(blockId, { data: updatedData });

      try {
        // 3. workspaceId와 orgId 확인
        if (!blockData.workspaceId || !blockData.orgId) {
          console.error('Missing workspaceId or orgId in blockData', {
            blockData,
            blockId,
          });
          updateNode(blockId, { data: originalData });
          return;
        }

        // 4. 프론트엔드 검증 (UX 최적화)
        const rawRequest: UpdateBlockPropertyRequestInput = {
          blockId: blockData.blockId,
          propertyPath,
          value,
          workspaceId: blockData.workspaceId,
          orgId: blockData.orgId,
        };

        const parseResult =
          UpdateBlockPropertyRequestSchema.safeParse(rawRequest);
        if (!parseResult.success) {
          // 검증 실패 시 롤백
          updateNode(blockId, { data: originalData });
          const firstError = parseResult.error.issues[0];
          console.error('[Frontend Validation] Invalid property update data:', {
            message: firstError?.message || 'Invalid property update data',
            issues: parseResult.error.issues,
          });
          // TODO: toast.error로 사용자에게 피드백
          return;
        }

        // 5. Server Action 호출 (검증된 데이터)
        const result = await updateBlockPropertyAction(parseResult.data);

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
    [updateNode, updateNestedProperty]
  );

  const updatePropertyImmediate = useCallback(
    <T>(
      blockId: string,
      propertyPath: string,
      value: T,
      blockData: BlockNodeData
    ): void => {
      // 1. workspaceId와 orgId 확인
      if (!blockData.workspaceId || !blockData.orgId) {
        console.error('Missing workspaceId or orgId in blockData');
        return;
      }

      // 2. 프론트엔드 검증 (데이터 무결성)
      const rawRequest: UpdateBlockPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyPath,
        value,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
      };

      const parseResult =
        UpdateBlockPropertyRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error(
          '[Frontend Validation] Invalid immediate property update data:',
          {
            message: firstError?.message || 'Invalid property update data',
            issues: parseResult.error.issues,
          }
        );
        // TODO: toast.error로 사용자에게 피드백
        return;
      }

      // 3. Optimistic Update: React Flow Store 즉시 업데이트
      const updatedData = updateNestedProperty<T>(
        blockData,
        propertyPath,
        value
      );
      updateNode(blockId, { data: updatedData });
    },
    [updateNode, updateNestedProperty]
  );

  return {
    updateProperty,
    updatePropertyImmediate,
  };
}
