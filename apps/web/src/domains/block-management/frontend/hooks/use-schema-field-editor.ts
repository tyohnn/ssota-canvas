'use client';

import { useCallback } from 'react';
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
import { isFailure } from '@/lib';

export interface PropertyOption {
  id: string;
  label: string;
  color: string;
  order: number;
}

export interface UseSchemaFieldEditorResult {
  saveLabel: (
    blockId: string,
    propertyId: string,
    label: string
  ) => Promise<void>;
  deleteField: (blockId: string, propertyId: string) => Promise<void>;
  duplicateField: (blockId: string, propertyId: string) => Promise<void>;
  commitOptions: (
    blockId: string,
    propertyId: string,
    options: PropertyOption[]
  ) => Promise<void>;
}

/**
 * 커스텀 속성 정의 관리 Hook
 *
 * - 속성 라벨 저장
 * - 속성 삭제
 * - 속성 복제
 * - 옵션 커밋 (select/multi-select/status 타입)
 */
export function useSchemaFieldEditor(): UseSchemaFieldEditorResult {
  const { getNode, updateNode } = useReactFlow();

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
      const { workspaceId, orgId } = blockData;

      if (!workspaceId || !orgId) {
        throw new Error('Workspace context is missing');
      }

      const originalData = blockData;
      const updatedData = updatePropertyInArray(
        blockData,
        'customProperties',
        propertyId,
        { name: label }
      );

      const rawRequest: UpdateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyId,
        workspaceId,
        orgId,
        name: label,
      };

      try {
        const parseResult =
          UpdateCustomPropertyRequestSchema.safeParse(rawRequest);

        if (!parseResult.success) {
          const firstError = parseResult.error.issues[0];
          console.error('[useSchemaFieldEditor] Validation failed:', {
            message: firstError?.message || 'Invalid property label',
            issues: parseResult.error.issues,
          });
          throw new Error(firstError?.message || 'Invalid property label');
        }

        // Optimistic update
        updateNode(blockId, { data: updatedData });

        // Server action call
        const result = await updateCustomPropertyAction(parseResult.data);

        if (isFailure(result)) {
          // Rollback on failure
          updateNode(blockId, { data: originalData });
          throw new Error(result.error || 'Failed to save property label');
        }
      } catch (error) {
        // Rollback on error
        updateNode(blockId, { data: originalData });
        throw error;
      }
    },
    [getNode, updateNode]
  );

  const deleteField = useCallback(
    async (blockId: string, propertyId: string): Promise<void> => {
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      const blockData = blockNode.data as BlockNodeData;
      const { workspaceId, orgId } = blockData;

      if (!workspaceId || !orgId) {
        throw new Error('Workspace context is missing');
      }

      const originalData = blockData;
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

      const rawRequest: DeleteCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyId,
        workspaceId,
        orgId,
      };

      try {
        const parseResult =
          DeleteCustomPropertyRequestSchema.safeParse(rawRequest);

        if (!parseResult.success) {
          const firstError = parseResult.error.issues[0];
          console.error('[useSchemaFieldEditor] Validation failed:', {
            message: firstError?.message || 'Invalid delete request',
            issues: parseResult.error.issues,
            rawRequest,
          });
          throw new Error(firstError?.message || 'Invalid delete request');
        }

        // Optimistic update
        updateNode(blockId, { data: updatedData });

        // Server action call
        const result = await deleteCustomPropertyAction(parseResult.data);

        if (isFailure(result)) {
          // Rollback on failure
          updateNode(blockId, { data: originalData });
          throw new Error(result.error || 'Failed to delete property');
        }
      } catch (error) {
        // Rollback on error
        updateNode(blockId, { data: originalData });
        throw error;
      }
    },
    [getNode, updateNode]
  );

  const duplicateField = useCallback(
    async (blockId: string, propertyId: string): Promise<void> => {
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      const blockData = blockNode.data as BlockNodeData;
      const { workspaceId, orgId } = blockData;

      if (!workspaceId || !orgId) {
        throw new Error('Workspace context is missing');
      }

      const originalData = blockData;
      const property = findPropertyInArray(
        blockData,
        'customProperties',
        propertyId
      );

      if (!property) {
        throw new Error('Property not found');
      }

      const duplicatedProperty = {
        ...property,
        id: generateId(),
        name: `${property.name} (Copy)`,
      };

      const defaultValue =
        duplicatedProperty?.defaultValue !== undefined &&
        duplicatedProperty?.defaultValue !== null
          ? duplicatedProperty.defaultValue
          : getDefaultValueForType(duplicatedProperty.type);

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

      try {
        const parseResult =
          CreateCustomPropertyRequestSchema.safeParse(rawRequest);

        if (!parseResult.success) {
          const firstError = parseResult.error.issues[0];
          console.error('[useSchemaFieldEditor] Validation failed:', {
            message: firstError?.message || 'Invalid duplicate request',
            issues: parseResult.error.issues,
          });
          throw new Error(firstError?.message || 'Invalid duplicate request');
        }

        // Optimistic update
        updateNode(blockId, { data: updatedData });

        // Server action call
        const result = await createCustomPropertyAction(parseResult.data);

        if (isFailure(result)) {
          // Rollback on failure
          updateNode(blockId, { data: originalData });
          throw new Error(result.error || 'Failed to duplicate property');
        }
      } catch (error) {
        // Rollback on error
        updateNode(blockId, { data: originalData });
        throw error;
      }
    },
    [getNode, updateNode]
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
      const { workspaceId, orgId } = blockData;

      if (!workspaceId || !orgId) {
        throw new Error('Workspace context is missing');
      }

      const originalData = blockData;
      const updatedData = updatePropertyInArray(
        blockData,
        'customProperties',
        propertyId,
        { options }
      );

      const rawRequest: UpdateCustomPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyId,
        workspaceId,
        orgId,
        options,
      };

      try {
        const parseResult =
          UpdateCustomPropertyRequestSchema.safeParse(rawRequest);

        if (!parseResult.success) {
          const firstError = parseResult.error.issues[0];
          console.error('[useSchemaFieldEditor] Validation failed:', {
            message: firstError?.message || 'Invalid options',
            issues: parseResult.error.issues,
          });
          throw new Error(firstError?.message || 'Invalid options');
        }

        // Optimistic update
        updateNode(blockId, { data: updatedData });

        // Server action call
        const result = await updateCustomPropertyAction(parseResult.data);

        if (isFailure(result)) {
          // Rollback on failure
          updateNode(blockId, { data: originalData });
          throw new Error(result.error || 'Failed to commit options');
        }
      } catch (error) {
        // Rollback on error
        updateNode(blockId, { data: originalData });
        throw error;
      }
    },
    [getNode, updateNode]
  );

  return {
    saveLabel,
    deleteField,
    duplicateField,
    commitOptions,
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
function addPropertyToArray(data: any, arrayPath: string, property: any): any {
  const array = getNestedProperty(data, arrayPath) || [];
  const updatedArray = [...array, property];

  return setNestedProperty(data, arrayPath, updatedArray);
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
function setNestedProperty(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const result = { ...obj };
  let current: any = result;

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

  return result;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultValueForType(type: string | undefined): any {
  switch (type) {
    case 'text':
    case 'url':
    case 'email':
    case 'phone':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'color':
      return '#000000';
    case 'date':
    case 'select':
    case 'multiselect':
    case 'profile':
    default:
      return null;
  }
}
