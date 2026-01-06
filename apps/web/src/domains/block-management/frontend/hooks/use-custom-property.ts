'use client';

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import {
  createCustomPropertyAction,
  updateCustomPropertyAction,
  deleteCustomPropertyAction,
} from '../../actions/property.actions';
import {
  CreateCustomPropertyRequestSchema,
  UpdateCustomPropertyRequestSchema,
  DeleteCustomPropertyRequestSchema,
  type CreateCustomPropertyRequestInput,
  type UpdateCustomPropertyRequestInput,
  type DeleteCustomPropertyRequestInput,
} from '../../shared/dtos/requests';
import { BlockNodeData } from '../../shared/types/block-data.types';
import {
  PropertyType,
  type CustomPropertyDefinition,
  type PropertyOption,
} from '../../shared/value-objects/block-properties/common-types';
import { isFailure } from '@/lib';
import { toast } from '@workspace/ui/components/ui/sonner';

export interface UseCustomPropertyResult {
  saveLabel: (
    blockId: string,
    propertyId: string,
    label: string
  ) => Promise<void>;
  saveIcon: (
    blockId: string,
    propertyId: string,
    icon: string | null
  ) => Promise<void>;
  deleteProperty: (blockId: string, propertyId: string) => Promise<void>;
  duplicateProperty: (blockId: string, propertyId: string) => Promise<void>;
  commitOptions: (
    blockId: string,
    propertyId: string,
    options: PropertyOption[]
  ) => Promise<void>;
  createProperty: (
    blockId: string,
    params: {
      name: string;
      type: PropertyType;
      icon: string;
    }
  ) => Promise<string>;
}

/**
 * 커스텀 속성 정의 관리 Hook (TanStack Query Optimistic Update)
 *
 * - 속성 라벨 저장
 * - 속성 아이콘 저장
 * - 속성 삭제
 * - 속성 복제
 * - 옵션 커밋 (select/multi-select/status 타입)
 * - 속성 생성
 */
export function useCustomProperty(): UseCustomPropertyResult {
  const { getNode, updateNode } = useReactFlow();

  // ============================================================================
  // Mutation: Save Label
  // ============================================================================

  const saveLabelMutation = useMutation({
    mutationFn: async ({
      blockId,
      propertyId,
      label,
      blockData,
    }: {
      blockId: string;
      propertyId: string;
      label: string;
      blockData: BlockNodeData;
    }) => {
      const rawRequest: UpdateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyId,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
        name: label,
      };

      const parseResult =
        UpdateCustomPropertyRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid property label');
      }

      const result = await updateCustomPropertyAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error || 'Failed to save property label');
      }
    },
    onMutate: async ({ blockId, propertyId, label, blockData }) => {
      const previousData = blockData;
      const updatedData = updatePropertyInArray(
        blockData,
        'customProperties',
        propertyId,
        { name: label }
      );
      updateNode(blockId, { data: updatedData });
      return { previousData, blockId };
    },
    onError: (error, variables, context) => {
      if (context?.previousData && context?.blockId) {
        updateNode(context.blockId, { data: context.previousData });
      }
      toast.error(error.message);
    },
  });

  // ============================================================================
  // Mutation: Save Icon
  // ============================================================================

  const saveIconMutation = useMutation({
    mutationFn: async ({
      blockId,
      propertyId,
      icon,
      blockData,
    }: {
      blockId: string;
      propertyId: string;
      icon: string | null;
      blockData: BlockNodeData;
    }) => {
      const rawRequest: UpdateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyId,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
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
      toast.error(error.message);
    },
  });

  // ============================================================================
  // Mutation: Delete Property
  // ============================================================================

  const deletePropertyMutation = useMutation({
    mutationFn: async ({
      blockId,
      propertyId,
      blockData,
    }: {
      blockId: string;
      propertyId: string;
      blockData: BlockNodeData;
    }) => {
      const rawRequest: DeleteCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyId,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
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
      toast.error(error.message);
    },
  });

  // ============================================================================
  // Mutation: Duplicate Property
  // ============================================================================

  const duplicatePropertyMutation = useMutation({
    mutationFn: async ({
      blockId,
      propertyId,
      blockData,
      duplicatedProperty,
      defaultValue,
    }: {
      blockId: string;
      propertyId: string;
      blockData: BlockNodeData;
      duplicatedProperty: CustomPropertyDefinition;
      defaultValue: unknown;
    }) => {
      const rawRequest: CreateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
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
      const previousData = blockData;
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
      return { previousData, blockId };
    },
    onError: (error, variables, context) => {
      if (context?.previousData && context?.blockId) {
        updateNode(context.blockId, { data: context.previousData });
      }
      toast.error(error.message);
    },
  });

  // ============================================================================
  // Mutation: Commit Options
  // ============================================================================

  const commitOptionsMutation = useMutation({
    mutationFn: async ({
      blockId,
      propertyId,
      options,
      blockData,
    }: {
      blockId: string;
      propertyId: string;
      options: PropertyOption[];
      blockData: BlockNodeData;
    }) => {
      const rawRequest: UpdateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyId,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
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
      toast.error(error.message);
    },
  });

  // ============================================================================
  // Mutation: Create Property
  // ============================================================================

  const createPropertyMutation = useMutation({
    mutationFn: async ({
      blockId,
      propertyId,
      blockData,
      newProperty,
    }: {
      blockId: string;
      propertyId: string;
      blockData: BlockNodeData;
      newProperty: CustomPropertyDefinition;
    }) => {
      const rawRequest: CreateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
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
      // 속성 추가
      const updatedCustomProperties = addPropertyToArray(
        blockData,
        'customProperties',
        newProperty
      ).customProperties;

      // 초기 값 설정
      const updatedProperties = {
        ...(blockData.properties as unknown as Record<string, unknown>),
        [newProperty.id]: newProperty.defaultValue,
      };

      // 데이터 업데이트
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
      toast.error(error.message);
    },
  });

  // ============================================================================
  // Wrapper Functions
  // ============================================================================

  const saveLabel = useCallback(
    async (
      blockId: string,
      propertyId: string,
      label: string
    ): Promise<void> => {
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      const blockData = blockNode.data as BlockNodeData;
      if (!blockData.workspaceId || !blockData.orgId) {
        throw new Error('Workspace context is missing');
      }

      await saveLabelMutation.mutateAsync({
        blockId,
        propertyId,
        label,
        blockData,
      });
    },
    [getNode, saveLabelMutation]
  );

  const saveIcon = useCallback(
    async (
      blockId: string,
      propertyId: string,
      icon: string | null
    ): Promise<void> => {
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      const blockData = blockNode.data as BlockNodeData;
      if (!blockData.workspaceId || !blockData.orgId) {
        throw new Error('Workspace context is missing');
      }

      await saveIconMutation.mutateAsync({
        blockId,
        propertyId,
        icon,
        blockData,
      });
    },
    [getNode, saveIconMutation]
  );

  const deleteProperty = useCallback(
    async (blockId: string, propertyId: string): Promise<void> => {
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      const blockData = blockNode.data as BlockNodeData;
      if (!blockData.workspaceId || !blockData.orgId) {
        throw new Error('Workspace context is missing');
      }

      await deletePropertyMutation.mutateAsync({
        blockId,
        propertyId,
        blockData,
      });
    },
    [getNode, deletePropertyMutation]
  );

  const duplicateProperty = useCallback(
    async (blockId: string, propertyId: string): Promise<void> => {
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      const blockData = blockNode.data as BlockNodeData;
      if (!blockData.workspaceId || !blockData.orgId) {
        throw new Error('Workspace context is missing');
      }

      const property = findPropertyInArray(
        blockData,
        'customProperties',
        propertyId
      );

      if (!property) {
        throw new Error('Property not found');
      }

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

      await duplicatePropertyMutation.mutateAsync({
        blockId,
        propertyId,
        blockData,
        duplicatedProperty,
        defaultValue,
      });
    },
    [getNode, duplicatePropertyMutation]
  );

  const commitOptions = useCallback(
    async (
      blockId: string,
      propertyId: string,
      options: PropertyOption[]
    ): Promise<void> => {
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      const blockData = blockNode.data as BlockNodeData;
      if (!blockData.workspaceId || !blockData.orgId) {
        throw new Error('Workspace context is missing');
      }

      await commitOptionsMutation.mutateAsync({
        blockId,
        propertyId,
        options,
        blockData,
      });
    },
    [getNode, commitOptionsMutation]
  );

  const createProperty = useCallback(
    async (
      blockId: string,
      params: {
        name: string;
        type: PropertyType;
        icon: string;
      }
    ): Promise<string> => {
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      const currentBlockData = blockNode.data as BlockNodeData;
      if (!currentBlockData.workspaceId || !currentBlockData.orgId) {
        throw new Error('Workspace context is missing');
      }

      const propertyId = generateId();
      const name = params.name.trim();
      const order =
        (currentBlockData.customProperties as CustomPropertyDefinition[])
          ?.length || 0;
      const visible = true;
      const required = false;
      const options = requiresOptions(params.type)
        ? [createDefaultOption()]
        : undefined;
      const defaultValue = getDefaultValueForType(params.type);

      const newProperty: CustomPropertyDefinition = {
        id: propertyId,
        name,
        type: params.type,
        order,
        visible,
        required,
        defaultValue,
        options,
        icon: params.icon,
      };

      return await createPropertyMutation.mutateAsync({
        blockId,
        propertyId,
        blockData: currentBlockData,
        newProperty,
      });
    },
    [getNode, createPropertyMutation]
  );

  return {
    saveLabel,
    saveIcon,
    deleteProperty,
    duplicateProperty,
    commitOptions,
    createProperty,
  };
}

/**
 * Update property in array by ID
 */
function updatePropertyInArray(
  data: any,
  arrayPath: string,
  propertyId: string,
  updates: Record<string, any>
): any {
  const array = getNestedProperty(data, arrayPath) || [];
  const updatedArray = array.map((item: any) =>
    item.id === propertyId ? { ...item, ...updates } : item
  );

  return setNestedProperty(data, arrayPath, updatedArray);
}

/**
 * Remove property from array by ID
 */
function removePropertyFromArray(
  data: any,
  arrayPath: string,
  propertyId: string
): any {
  const array = getNestedProperty(data, arrayPath) || [];
  const updatedArray = array.filter((item: any) => item.id !== propertyId);

  return setNestedProperty(data, arrayPath, updatedArray);
}

/**
 * Add property to array
 */
function addPropertyToArray(
  data: BlockNodeData,
  arrayPath: string,
  property: CustomPropertyDefinition
): BlockNodeData {
  const array = getNestedProperty(data, arrayPath) || [];
  const updatedArray = [...array, property] as CustomPropertyDefinition[];

  return setNestedProperty(data, arrayPath, updatedArray) as BlockNodeData;
}

/**
 * Find property in array by ID
 */
function findPropertyInArray(
  data: any,
  arrayPath: string,
  propertyId: string
): any {
  const array = getNestedProperty(data, arrayPath) || [];
  return array.find((item: any) => item.id === propertyId);
}

/**
 * Get nested property using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested property using dot notation
 */
function setNestedProperty(
  obj: BlockNodeData,
  path: string,
  value: any
): BlockNodeData {
  const keys = path.split('.');
  const result = { ...obj };
  let current: BlockNodeData = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key && !(key in current)) {
      current[key] = {};
    }
    if (key) {
      current[key] = { ...current[key] };
      current = current[key];
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }

  return result as BlockNodeData;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `prop-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function requiresOptions(type: PropertyType): boolean {
  return (
    type === PropertyType.SELECT ||
    type === PropertyType.MULTISELECT ||
    type === PropertyType.STATUS
  );
}

function createDefaultOption(): PropertyOption {
  const optionId = `opt-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
  return {
    id: optionId,
    label: 'New Option',
    value: optionId,
    color: 'gray',
    order: 0,
    disabled: false,
  };
}

function getDefaultValueForType(type: PropertyType | string | undefined): any {
  switch (type) {
    case PropertyType.TEXT:
    case PropertyType.URL:
    case PropertyType.EMAIL:
    case PropertyType.PHONE:
      return '';
    case PropertyType.NUMBER:
      return 0;
    case PropertyType.BOOLEAN:
      return false;
    case PropertyType.COLOR:
      return '#000000';
    case PropertyType.DATE:
    case PropertyType.SELECT:
    case PropertyType.MULTISELECT:
    case PropertyType.STATUS:
    case PropertyType.PROFILE:
    default:
      return null;
  }
}
