'use client';

import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import { createCustomPropertyAction } from '../../../actions/property/create-custom-property.action';
import {
  type CreateCustomPropertyRequestInput,
  CreateCustomPropertyRequestSchema,
} from '../../../shared/dtos/requests';
import type { BlockNodeData } from '../../../shared/types/block-data.types';
import {
  type CustomPropertyDefinition,
  PropertyType,
} from '../../../shared/value-objects/block-properties/common-types';
import { isFailure } from '@/lib';

import {
  addPropertyToArray,
  createDefaultOption,
  generateId,
  getDefaultValueForType,
  requiresOptions,
} from './helpers';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
};

export type CreatePropertyInput = {
  blockId: string;
  params: {
    name: string;
    type: PropertyType;
    icon: string;
  };
};

export type UseCreatePropertyResult = {
  createProperty: (input: CreatePropertyInput) => Promise<string>;
  isCreating: boolean;
};

/**
 * 속성 생성 훅 (TanStack Query Optimistic Update)
 */
export function useCreateProperty(
  reactFlow: ReactFlowDependencies
): UseCreatePropertyResult {
  const { getNode, updateNode } = reactFlow;

  const mutation = useMutation({
    mutationFn: async ({
      blockId: _blockId,
      propertyId,
      blockData,
      newProperty,
    }: CreatePropertyInput & {
      blockData: BlockNodeData;
      newProperty: CustomPropertyDefinition;
      propertyId: string;
    }) => {
      const { workspaceId, orgId } = blockData;
      if (!workspaceId || !orgId) {
        throw new Error('Workspace context is missing');
      }

      const rawRequest: CreateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        workspaceId,
        orgId,
        id: propertyId,
        name: newProperty.name,
        type: newProperty.type,
        order: newProperty.order,
        visible: newProperty.visible,
        required: newProperty.required,
        defaultValue: newProperty.defaultValue,
        options: newProperty.options,
        icon: newProperty.icon,
      };

      const parseResult =
        CreateCustomPropertyRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(
          firstError?.message || 'Invalid property create request'
        );
      }

      const result = await createCustomPropertyAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error || 'Failed to create property');
      }

      return propertyId;
    },

    onMutate: async ({ blockId, newProperty, blockData }) => {
      const previousData = blockData;
      const updatedCustomProperties = addPropertyToArray(
        blockData,
        'customProperties',
        newProperty
      ).customProperties;

      const updatedProperties = {
        ...(blockData.properties as unknown as Record<string, unknown>),
        [newProperty.id]: newProperty.defaultValue,
      };

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
    createProperty: async (input: CreatePropertyInput): Promise<string> => {
      const blockNode = getNode(input.blockId);
      if (!blockNode) throw new Error('Block not found');
      const blockData = blockNode.data as BlockNodeData;

      const propertyId = generateId();
      const name = input.params.name.trim();
      const order =
        (blockData.customProperties as CustomPropertyDefinition[])?.length ||
        0;
      const visible = true;
      const required = false;
      const options = requiresOptions(input.params.type)
        ? [createDefaultOption()]
        : undefined;
      const defaultValue = getDefaultValueForType(input.params.type);

      const newProperty: CustomPropertyDefinition = {
        id: propertyId,
        name,
        type: input.params.type,
        order,
        visible,
        required,
        defaultValue,
        options,
        icon: input.params.icon,
      };

      return await mutation.mutateAsync({
        ...input,
        blockData,
        newProperty,
        propertyId,
      });
    },
    isCreating: mutation.isPending,
  };
}
