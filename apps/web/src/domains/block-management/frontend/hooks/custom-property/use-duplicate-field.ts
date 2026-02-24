'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { createCustomPropertyAction } from '../../../actions/property/create-custom-property.action';
import {
  type CreateCustomPropertyRequestInput,
  CreateCustomPropertyRequestSchema,
} from '../../../shared/dtos/requests';
import type { BlockNodeData } from '../../../shared/types/block-data.types';
import type { CustomPropertyDefinition } from '../../../shared/value-objects/block-properties/common-types';
import { isFailure } from '@/lib';

import {
  addPropertyToArray,
  findPropertyInArray,
  generateId,
  getDefaultValueForType,
} from './helpers';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
};

export type DuplicateFieldInput = {
  blockId: string;
  propertyId: string;
};

export type UseDuplicateFieldResult = {
  duplicateField: (input: DuplicateFieldInput) => Promise<void>;
  isDuplicating: boolean;
};

/**
 * 속성 복제 훅 (TanStack Query Optimistic Update)
 */
export function useDuplicateField(
  reactFlow: ReactFlowDependencies
): UseDuplicateFieldResult {
  const { getNode, updateNode } = reactFlow;

  const mutation = useMutation({
    mutationFn: async ({
      blockId: _blockId,
      propertyId: _propertyId,
      blockData,
      duplicatedProperty,
      defaultValue,
    }: DuplicateFieldInput & {
      blockData: BlockNodeData;
      duplicatedProperty: CustomPropertyDefinition;
      defaultValue: unknown;
    }) => {
      const { workspaceId, orgId } = blockData;
      if (!workspaceId || !orgId) {
        throw new Error('Workspace context is missing');
      }

      const rawRequest: CreateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        workspaceId,
        orgId,
        id: duplicatedProperty.id,
        name: duplicatedProperty.name,
        type: duplicatedProperty.type,
        options: duplicatedProperty.options,
        order: duplicatedProperty.order,
        visible: duplicatedProperty.visible,
        required: duplicatedProperty.required,
        defaultValue,
      };

      const parseResult =
        CreateCustomPropertyRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid duplicate request');
      }

      const result = await createCustomPropertyAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error || 'Failed to duplicate property');
      }
    },

    onMutate: async ({
      blockId,
      propertyId,
      blockData,
      duplicatedProperty,
      defaultValue,
    }) => {
      const updatedCustomProperties = addPropertyToArray(
        blockData,
        'customProperties',
        duplicatedProperty
      ).customProperties;

      const updatedProperties = {
        ...(blockData.properties as unknown as Record<string, unknown>),
        [duplicatedProperty.id]: defaultValue,
      };

      const updatedData = {
        ...blockData,
        customProperties:
          updatedCustomProperties as BlockNodeData['customProperties'],
        properties: updatedProperties as unknown as BlockNodeData['properties'],
      } as BlockNodeData;

      updateNode(blockId, { data: updatedData });
      return {
        previousData: blockData,
        blockId,
      };
    },

    onError: (error, variables, context) => {
      if (context?.previousData && context?.blockId) {
        updateNode(context.blockId, { data: context.previousData });
      }
    },
  });

  return {
    duplicateField: async (input: DuplicateFieldInput) => {
      const blockNode = getNode(input.blockId);
      if (!blockNode) throw new Error('Block not found');
      const blockData = blockNode.data as BlockNodeData;

      const property = findPropertyInArray(
        blockData,
        'customProperties',
        input.propertyId
      );
      if (!property) throw new Error('Property not found');

      const duplicatedProperty: CustomPropertyDefinition = {
        ...property,
        id: generateId(),
        name: `${property.name} (Copy)`,
      };

      const defaultValue =
        duplicatedProperty?.defaultValue !== undefined &&
        duplicatedProperty?.defaultValue !== null
          ? duplicatedProperty.defaultValue
          : getDefaultValueForType(duplicatedProperty.type);

      await mutation.mutateAsync({
        ...input,
        blockData,
        duplicatedProperty,
        defaultValue,
      });
    },
    isDuplicating: mutation.isPending,
  };
}
