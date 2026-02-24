'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { updateCustomPropertyAction } from '../../../actions/property/update-custom-property.action';
import {
  type UpdateCustomPropertyRequestInput,
  UpdateCustomPropertyRequestSchema,
} from '../../../shared/dtos/requests';
import type { BlockNodeData } from '../../../shared/types/block-data.types';
import { isFailure } from '@/lib';

import { updatePropertyInArray } from './helpers';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
};

export type SaveIconInput = {
  blockId: string;
  propertyId: string;
  icon: string | null;
};

export type UseSaveIconResult = {
  saveIcon: (input: SaveIconInput) => Promise<void>;
  isSaving: boolean;
};

/**
 * 속성 아이콘 저장 훅 (TanStack Query Optimistic Update)
 */
export function useSaveIcon(
  reactFlow: ReactFlowDependencies
): UseSaveIconResult {
  const { getNode, updateNode } = reactFlow;

  const mutation = useMutation({
    mutationFn: async ({
      blockId: _blockId,
      propertyId,
      icon,
      blockData,
    }: SaveIconInput & { blockData: BlockNodeData }) => {
      const { workspaceId, orgId } = blockData;
      if (!workspaceId || !orgId) {
        throw new Error('Workspace context is missing');
      }

      const rawRequest: UpdateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyId,
        workspaceId,
        orgId,
        icon,
      };

      const parseResult =
        UpdateCustomPropertyRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid property icon');
      }

      const result = await updateCustomPropertyAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error || 'Failed to save property icon');
      }
    },

    onMutate: async ({ blockId, propertyId, icon, blockData }) => {
      const previousData = blockData;
      const updatedData = updatePropertyInArray(
        blockData,
        'customProperties',
        propertyId,
        { icon }
      );
      updateNode(blockId, { data: updatedData });
      return { previousData, blockId };
    },

    onError: (error, variables, context) => {
      if (context?.previousData && context?.blockId) {
        updateNode(context.blockId, { data: context.previousData });
      }
    },
  });

  return {
    saveIcon: async (input: SaveIconInput) => {
      const blockNode = getNode(input.blockId);
      if (!blockNode) throw new Error('Block not found');
      const blockData = blockNode.data as BlockNodeData;
      await mutation.mutateAsync({ ...input, blockData });
    },
    isSaving: mutation.isPending,
  };
}
