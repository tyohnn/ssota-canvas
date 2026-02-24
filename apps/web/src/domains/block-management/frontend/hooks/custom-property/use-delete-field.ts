'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { deleteCustomPropertyAction } from '../../../actions/property/delete-custom-property.action';
import {
  type DeleteCustomPropertyRequestInput,
  DeleteCustomPropertyRequestSchema,
} from '../../../shared/dtos/requests';
import type { BlockNodeData } from '../../../shared/types/block-data.types';
import { isFailure } from '@/lib';

import { removePropertyFromArray } from './helpers';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
};

export type DeleteFieldInput = {
  blockId: string;
  propertyId: string;
};

export type UseDeleteFieldResult = {
  deleteField: (input: DeleteFieldInput) => Promise<void>;
  isDeleting: boolean;
};

/**
 * 속성 삭제 훅 (TanStack Query Optimistic Update)
 */
export function useDeleteField(
  reactFlow: ReactFlowDependencies
): UseDeleteFieldResult {
  const { getNode, updateNode } = reactFlow;

  const mutation = useMutation({
    mutationFn: async ({
      blockId: _blockId,
      propertyId,
      blockData,
    }: DeleteFieldInput & { blockData: BlockNodeData }) => {
      const { workspaceId, orgId } = blockData;
      if (!workspaceId || !orgId) {
        throw new Error('Workspace context is missing');
      }

      const rawRequest: DeleteCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyId,
        workspaceId,
        orgId,
      };

      const parseResult =
        DeleteCustomPropertyRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid delete request');
      }

      const result = await deleteCustomPropertyAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error || 'Failed to delete property');
      }
    },

    onMutate: async ({ blockId, propertyId, blockData }) => {
      const previousData = blockData;
      const updatedCustomProperties = removePropertyFromArray(
        blockData,
        'customProperties',
        propertyId
      ).customProperties;

      const updatedProperties = {
        ...(blockData.properties as unknown as Record<string, unknown>),
      };
      delete updatedProperties[propertyId];

      const updatedData = {
        ...blockData,
        customProperties:
          updatedCustomProperties as BlockNodeData['customProperties'],
        properties: updatedProperties as unknown as BlockNodeData['properties'],
      } as BlockNodeData;

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
    deleteField: async (input: DeleteFieldInput) => {
      const blockNode = getNode(input.blockId);
      if (!blockNode) throw new Error('Block not found');
      const blockData = blockNode.data as BlockNodeData;
      await mutation.mutateAsync({ ...input, blockData });
    },
    isDeleting: mutation.isPending,
  };
}
