'use client';

import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import type { CanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { toast } from '@workspace/ui/components/ui/sonner';

import { isFailure, uuidToSlug } from '@/lib';

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

/** Canvas mode: uses React Flow for optimistic update. workspaceId from useCanvasMetadata. */
export type UseUpdateBlockPropertyParamsCanvas = {
  reactFlow: ReactFlowDependencies;
  /** 테스트 시 mock 주입용. 미제공 시 useCanvasMetadata() 사용 */
  canvasMetadata?: CanvasMetadata;
};

/** Standalone mode (Drive): server-only, no React Flow. */
export type UseUpdateBlockPropertyParamsStandalone = {
  workspaceId: string;
};

export type UseUpdateBlockPropertyParams =
  | UseUpdateBlockPropertyParamsCanvas
  | UseUpdateBlockPropertyParamsStandalone;

function isCanvasParams(
  p: UseUpdateBlockPropertyParams
): p is UseUpdateBlockPropertyParamsCanvas {
  return 'reactFlow' in p;
}

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
 * 블록 속성 업데이트 Hook (canvas/standalone 통합)
 *
 * Canvas (reactFlow 제공): React Flow Store 즉시 업데이트 + Server Action, 실패 시 롤백
 * Standalone (workspaceId만): Server Action만 호출, updatePropertyImmediate는 no-op
 */
export function useUpdateBlockProperty(
  params: UseUpdateBlockPropertyParams
): UseBlockPropertyUpdateResult {
  const isCanvas = isCanvasParams(params);
  const reactFlow = isCanvas ? params.reactFlow : undefined;
  const { updateNode, getNode } = reactFlow ?? {
    updateNode: (_: string, __: { data: BlockNodeData }) => {},
    getNode: (_: string) => undefined,
  };
  const workspaceId = isCanvas
    ? (params.canvasMetadata ?? useCanvasMetadata()).workspaceId
    : params.workspaceId;

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
      if (!workspaceId) throw new Error('Workspace context required');
      // Normalize blockId: API expects 8-10 char slug, node data may have UUID from legacy/optimistic paths
      const blockIdSlug =
        blockId.length > 10 || blockId.includes('-')
          ? uuidToSlug(blockId)
          : blockId;
      const request: UpdateBlockPropertyRequestInput = {
        workspaceId,
        blockId: blockIdSlug,
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

    // Optimistic Update (canvas only)
    onMutate: async ({
      propertyPath,
      value,
      blockMountId,
      blockData,
    }: UpdatePropertyVariables) => {
      if (!isCanvas) return undefined;
      const nodeId = blockMountId;
      const currentBlockData = blockData;
      const previousData = currentBlockData;
      const updatedData = updateNestedProperty(
        currentBlockData,
        propertyPath,
        value
      );
      updateNode(nodeId, { data: updatedData });
      return { previousData, nodeId };
    },

    // Rollback on error (canvas only)
    onError: (error, variables, context) => {
      if (isCanvas && context?.previousData && context?.nodeId) {
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
    }: UpdatePropertiesVariables) => {
      if (!workspaceId) throw new Error('Workspace context required');
      // Normalize blockId: API expects 8-10 char slug
      const blockIdSlug =
        blockId.length > 10 || blockId.includes('-')
          ? uuidToSlug(blockId)
          : blockId;
      const { sourceId: _sourceId, ...propertyFields } =
        properties as Record<string, unknown>;
      const request: UpdateBlockPropertiesRequestInput = {
        workspaceId,
        blockId: blockIdSlug,
        properties: propertyFields,
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

    // Optimistic Update (canvas only)
    onMutate: async ({
      properties,
      blockMountId,
      blockData,
    }: UpdatePropertiesVariables) => {
      if (!isCanvas) return undefined;
      const nodeId = blockMountId;
      const previousData = blockData;
      const { sourceId, ...propertyFields } = properties as Record<
        string,
        unknown
      >;
      const updatedData: BlockNodeData = {
        ...blockData,
        ...(sourceId !== undefined && { sourceId: sourceId as string }),
        properties: {
          ...(blockData.properties as any),
          ...propertyFields,
        } as any,
      };
      updateNode(nodeId, { data: updatedData });
      return { previousData, nodeId };
    },

    // Rollback on error (canvas only)
    onError: (error, variables, context) => {
      if (isCanvas && context?.previousData && context?.nodeId) {
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
      // 그룹 생성 직후 blockId가 임시 ID일 수 있으므로, 최신 노드 데이터에서 blockId를 가져옴
      const latestNode = getNode(blockData.blockMountId);
      const actualBlockId: string = (latestNode?.data?.blockId ?? blockData.blockId ?? blockId) as string;
      await propertyMutation.mutateAsync({
        blockId: actualBlockId, // 최신 노드 데이터의 blockId 사용
        propertyPath,
        value,
        blockMountId: blockData.blockMountId, // onMutate에서만 사용
        blockData, // onMutate에서만 사용
      });
    },
    [propertyMutation, getNode]
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
   * Immediate update (no server sync). Canvas only; no-op in standalone.
   */
  const updatePropertyImmediate = useCallback(
    <T>(
      blockId: string,
      propertyPath: string,
      value: T,
      blockData: BlockNodeData
    ): void => {
      if (!isCanvas) return; // Standalone: no React Flow store to update
      const nodeId = blockData.blockMountId;
      const latestNode = getNode(nodeId);
      if (!latestNode) {
        console.warn(
          `[useUpdateBlockProperty] Node not found in React Flow Store: ${nodeId}. Using provided blockData as fallback.`
        );
      }
      const currentBlockData = (latestNode?.data as BlockNodeData) || blockData;

      if (!workspaceId) return;
      const request: UpdateBlockPropertyRequestInput = {
        workspaceId,
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
    [updateNode, getNode, workspaceId]
  );

  return {
    updateProperty,
    updateProperties,
    updatePropertyImmediate,
    isUpdating: propertyMutation.isPending || propertiesMutation.isPending,
  };
}
