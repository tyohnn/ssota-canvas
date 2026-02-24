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
import type { SchemaFieldPropertyOption } from './types';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
};

export type CommitOptionsInput = {
  blockId: string;
  propertyId: string;
  options: SchemaFieldPropertyOption[];
};

export type UseCommitOptionsResult = {
  commitOptions: (input: CommitOptionsInput) => Promise<void>;
  isCommitting: boolean;
};

/**
 * 옵션 커밋 훅 (select/multi-select/status, TanStack Query Optimistic Update)
 */
export function useCommitOptions(
  reactFlow: ReactFlowDependencies
): UseCommitOptionsResult {
  const { getNode, updateNode } = reactFlow;

  const mutation = useMutation({
    mutationFn: async ({
      blockId: _blockId,
      propertyId,
      options,
      blockData,
    }: CommitOptionsInput & { blockData: BlockNodeData }) => {
      const { workspaceId, orgId } = blockData;
      if (!workspaceId || !orgId) {
        throw new Error('Workspace context is missing');
      }

      const rawRequest: UpdateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyId,
        workspaceId,
        orgId,
        options,
      };

      const parseResult =
        UpdateCustomPropertyRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid options');
      }

      const result = await updateCustomPropertyAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error || 'Failed to commit options');
      }
    },

    onMutate: async ({ blockId, propertyId, options, blockData }) => {
      const previousData = blockData;
      const updatedData = updatePropertyInArray(
        blockData,
        'customProperties',
        propertyId,
        { options }
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
    commitOptions: async (input: CommitOptionsInput) => {
      const blockNode = getNode(input.blockId);
      if (!blockNode) throw new Error('Block not found');
      const blockData = blockNode.data as BlockNodeData;
      await mutation.mutateAsync({ ...input, blockData });
    },
    isCommitting: mutation.isPending,
  };
}
