'use client';

import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { toast } from '@workspace/ui/components/ui/sonner';

import { isFailure } from '@/lib';

import { updateBlockPropertiesAction } from '../../../actions/block/update-block-properties.action';
import { updateBlockPropertyAction } from '../../../actions/block/update-block-property.action';
import {
  type UpdateBlockPropertiesRequestInput,
  UpdateBlockPropertiesRequestSchema,
  type UpdateBlockPropertyRequestInput,
  UpdateBlockPropertyRequestSchema,
} from '../../../shared/dtos/requests';
import { BlockNodeData } from '../../../shared/types/block-data.types';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
};

export type UseUpdateBlockPropertyParams = {
  reactFlow: ReactFlowDependencies;
};

export interface UseBlockPropertyUpdateResult {
  updateProperty: <T>(
    blockId: string,
    propertyPath: string,
    value: T,
    blockData: BlockNodeData
  ) => Promise<void>;
  updateProperties: (
    blockId: string,
    properties: Record<string, unknown>,
    blockData: BlockNodeData
  ) => Promise<void>;
  updatePropertyImmediate: <T>(
    blockId: string,
    propertyPath: string,
    value: T,
    blockData: BlockNodeData
  ) => void;

  // TanStack Query 상태
  isUpdating: boolean;
}

// ============================================================================
// Utility: Nested Property Updater
// ============================================================================

function updateNestedProperty<T>(
  data: BlockNodeData,
  propertyPath: string,
  value: T
): BlockNodeData {
  const updatedData: any = { ...data };
  const pathParts = propertyPath.split('.');

  let current: any = updatedData;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!part) continue;

    const prev = current[part];
    if (prev === undefined || prev === null) {
      current[part] = {};
    } else if (Array.isArray(prev)) {
      current[part] = [...prev];
    } else if (typeof prev === 'object') {
      current[part] = { ...prev };
    } else {
      current[part] = {};
    }
    current = current[part];
  }

  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart) {
    current[lastPart] = value as any;
  }

  return updatedData as BlockNodeData;
}

// ============================================================================
// Hook: useBlockPropertyUpdate with TanStack Query
// ============================================================================

/**
 * 블록 속성 업데이트 Hook (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 */
export function useUpdateBlockProperty(
  params: UseUpdateBlockPropertyParams
): UseBlockPropertyUpdateResult {
  const { reactFlow } = params;
  const { updateNode, getNode } = reactFlow;

  // ============================================================================
  // Mutation: Update Single Property
  // ============================================================================

  type UpdatePropertyVariables = {
    blockId: string;
    propertyPath: string;
    value: unknown;
    blockMountId: string; // onMutate에서만 사용
    blockData: BlockNodeData; // onMutate에서만 사용
  };

  const propertyMutation = useMutation({
    mutationFn: async ({
      blockId,
      propertyPath,
      value,
      // blockMountId, blockData는 onMutate에서만 사용
    }: UpdatePropertyVariables) => {
      // Validation
      const request: UpdateBlockPropertyRequestInput = {
        blockId: blockId,
        propertyPath,
        value,
      };

      const parseResult = UpdateBlockPropertyRequestSchema.safeParse(request);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid property update data');
      }

      // Server Action
      const result = await updateBlockPropertyAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result;
    },

    // Optimistic Update
    onMutate: async ({
      propertyPath,
      value,
      blockMountId,
      blockData,
    }: UpdatePropertyVariables) => {
      // React Flow node id는 blockMountId (blockId와 다를 수 있음)
      const nodeId = blockMountId;

      // blockData를 직접 사용 (onMutate는 mutationFn 직전에 실행되므로 매우 빠른 시점)
      // 이 시점에는 다른 업데이트가 발생할 가능성이 거의 없으므로 전달받은 blockData를 신뢰
      const currentBlockData = blockData;

      // Backup original data
      const previousData = currentBlockData;

      // Apply optimistic update
      const updatedData = updateNestedProperty(
        currentBlockData,
        propertyPath,
        value
      );
      updateNode(nodeId, { data: updatedData });

      // Return context for rollback
      return { previousData, nodeId };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousData && context?.nodeId) {
        updateNode(context.nodeId, { data: context.previousData });
      }
      console.error('Failed to update property:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update property'
      );
    },
  });

  // ============================================================================
  // Mutation: Update Multiple Properties
  // ============================================================================

  type UpdatePropertiesVariables = {
    blockId: string;
    properties: Record<string, unknown>;
    blockMountId: string; // onMutate에서만 사용
    blockData: BlockNodeData; // onMutate에서만 사용
  };

  const propertiesMutation = useMutation({
    mutationFn: async ({
      blockId,
      properties,
      // blockMountId, blockData는 onMutate에서만 사용
    }: UpdatePropertiesVariables) => {
      // Validation
      const request: UpdateBlockPropertiesRequestInput = {
        blockId: blockId,
        properties,
      };

      const parseResult = UpdateBlockPropertiesRequestSchema.safeParse(request);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(
          firstError?.message || 'Invalid properties update data'
        );
      }

      // Server Action
      const result = await updateBlockPropertiesAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result;
    },

    // Optimistic Update
    onMutate: async ({
      properties,
      blockMountId,
      blockData,
    }: UpdatePropertiesVariables) => {
      // React Flow node id는 blockMountId (blockId와 다를 수 있음)
      const nodeId = blockMountId;

      // Backup original data
      const previousData = blockData;

      // Apply optimistic update (merge properties)
      const updatedData: BlockNodeData = {
        ...blockData,
        properties: {
          ...(blockData.properties as any),
          ...properties,
        } as any,
      };
      updateNode(nodeId, { data: updatedData });

      // Return context for rollback
      return { previousData, nodeId };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousData && context?.nodeId) {
        updateNode(context.nodeId, { data: context.previousData });
      }
      console.error('Failed to update properties:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update properties'
      );
    },
  });

  // ============================================================================
  // Public API
  // ============================================================================

  const updateProperty = useCallback(
    async <T>(
      blockId: string,
      propertyPath: string,
      value: T,
      blockData: BlockNodeData
    ): Promise<void> => {
      await propertyMutation.mutateAsync({
        blockId,
        propertyPath,
        value,
        blockMountId: blockData.blockMountId, // onMutate에서만 사용
        blockData, // onMutate에서만 사용
      });
    },
    [propertyMutation]
  );

  const updateProperties = useCallback(
    async (
      blockId: string,
      properties: Record<string, unknown>,
      blockData: BlockNodeData
    ): Promise<void> => {
      await propertiesMutation.mutateAsync({
        blockId,
        properties,
        blockMountId: blockData.blockMountId, // onMutate에서만 사용
        blockData, // onMutate에서만 사용
      });
    },
    [propertiesMutation]
  );

  /**
   * Immediate update (no server sync)
   * For real-time UI updates without waiting for server response
   */
  const updatePropertyImmediate = useCallback(
    <T>(
      blockId: string,
      propertyPath: string,
      value: T,
      blockData: BlockNodeData
    ): void => {
      // React Flow node id는 blockMountId (blockId와 다를 수 있음)
      const nodeId = blockData.blockMountId;

      // Get latest data from React Flow Store (SSOT)
      // ⚠️ 중요: updatePropertyImmediate는 서버 동기화 없이 즉시 업데이트하므로,
      // 여러 번 빠르게 호출될 수 있습니다. 따라서 항상 Store에서 최신 데이터를
      // 가져와야 동시성 문제를 방지할 수 있습니다.
      const latestNode = getNode(nodeId);
      if (!latestNode) {
        console.warn(
          `[useUpdateBlockProperty] Node not found in React Flow Store: ${nodeId}. Using provided blockData as fallback.`
        );
      }
      const currentBlockData = (latestNode?.data as BlockNodeData) || blockData;

      const request: UpdateBlockPropertyRequestInput = {
        blockId: currentBlockData.blockId,
        propertyPath,
        value,
      };

      const parseResult = UpdateBlockPropertyRequestSchema.safeParse(request);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error(
          '[Frontend Validation] Invalid immediate property update:',
          {
            message: firstError?.message || 'Invalid property update data',
            issues: parseResult.error.issues,
          }
        );
        return;
      }

      // Apply update immediately
      const updatedData = updateNestedProperty(
        currentBlockData,
        propertyPath,
        value
      );
      updateNode(nodeId, { data: updatedData });
    },
    [updateNode, getNode]
  );

  return {
    updateProperty,
    updateProperties,
    updatePropertyImmediate,
    isUpdating: propertyMutation.isPending || propertiesMutation.isPending,
  };
}
