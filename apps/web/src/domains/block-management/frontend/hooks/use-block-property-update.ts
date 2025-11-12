'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useMutation } from '@tanstack/react-query';
import {
  updateBlockPropertyAction,
  updateBlockPropertiesAction,
} from '../../actions/block.actions';
import { isFailure } from '@/lib/action-result';
import {
  UpdateBlockPropertyRequestSchema,
  UpdateBlockPropertiesRequestSchema,
  type UpdateBlockPropertyRequestInput,
  type UpdateBlockPropertiesRequestInput,
} from '../../shared/dtos/requests';
import { BlockNodeData } from '../../shared/types/block-data.types';
import { toast } from '@workspace/ui/components/ui/sonner';

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
export function useBlockPropertyUpdate(): UseBlockPropertyUpdateResult {
  const { updateNode, getNode } = useReactFlow();

  // ============================================================================
  // Mutation: Update Single Property
  // ============================================================================

  const propertyMutation = useMutation({
    mutationFn: async ({
      blockId,
      blockData,
      propertyPath,
      value,
    }: {
      blockId: string;
      blockData: BlockNodeData;
      propertyPath: string;
      value: unknown;
    }) => {
      // Validation
      if (!blockData.workspaceId || !blockData.orgId) {
        throw new Error('Missing workspaceId or orgId');
      }

      const request: UpdateBlockPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyPath,
        value,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
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
    onMutate: async ({ blockId, propertyPath, value, blockData }) => {
      // Get latest data
      const latestNode = getNode(blockId);
      const currentBlockData = (latestNode?.data as BlockNodeData) || blockData;

      // Backup original data
      const previousData = currentBlockData;

      // Apply optimistic update
      const updatedData = updateNestedProperty(
        currentBlockData,
        propertyPath,
        value
      );
      updateNode(blockId, { data: updatedData });

      // Return context for rollback
      return { previousData, blockId };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousData && context?.blockId) {
        updateNode(context.blockId, { data: context.previousData });
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

  const propertiesMutation = useMutation({
    mutationFn: async ({
      blockId,
      blockData,
      properties,
    }: {
      blockId: string;
      blockData: BlockNodeData;
      properties: Record<string, unknown>;
    }) => {
      // Validation
      if (!blockData.workspaceId || !blockData.orgId) {
        throw new Error('Missing workspaceId or orgId');
      }

      const request: UpdateBlockPropertiesRequestInput = {
        blockId: blockData.blockId,
        properties,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
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
    onMutate: async ({ blockId, properties, blockData }) => {
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
      updateNode(blockId, { data: updatedData });

      // Return context for rollback
      return { previousData, blockId };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousData && context?.blockId) {
        updateNode(context.blockId, { data: context.previousData });
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
        blockData,
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
        blockData,
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
      // Get latest data
      const latestNode = getNode(blockId);
      const currentBlockData = (latestNode?.data as BlockNodeData) || blockData;

      // Validation
      if (!currentBlockData.workspaceId || !currentBlockData.orgId) {
        console.error('Missing workspaceId or orgId');
        return;
      }

      const request: UpdateBlockPropertyRequestInput = {
        blockId: currentBlockData.blockId,
        propertyPath,
        value,
        workspaceId: currentBlockData.workspaceId,
        orgId: currentBlockData.orgId,
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
      updateNode(blockId, { data: updatedData });
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
