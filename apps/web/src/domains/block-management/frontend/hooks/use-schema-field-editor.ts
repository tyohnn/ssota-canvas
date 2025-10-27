'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  createCustomPropertyAction,
  updateCustomPropertyAction,
} from '../../actions/property.actions';

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

      const originalData = blockNode.data;
      const updatedData = updatePropertyInArray(
        originalData,
        'customProperties',
        propertyId,
        { name: label }
      );

      try {
        // Optimistic update
        updateNode(blockId, { data: updatedData });

        // Server action call
        const result = await updateCustomPropertyAction(propertyId, {
          workspaceId: 'workspace-id', // TODO: Get from context
          name: label,
        });

        if (!result.success) {
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

      const originalData = blockNode.data;
      const updatedData = removePropertyFromArray(
        originalData,
        'customProperties',
        propertyId
      );

      try {
        // Optimistic update
        updateNode(blockId, { data: updatedData });

        // Server action call
        await updateCustomPropertyAction(propertyId, {
          workspaceId: 'workspace-id', // TODO: Get from context
        });
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

      const originalData = blockNode.data;
      const property = findPropertyInArray(
        originalData,
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

      const updatedData = addPropertyToArray(
        originalData,
        'customProperties',
        duplicatedProperty
      );

      try {
        // Optimistic update
        updateNode(blockId, { data: updatedData });

        // Server action call
        const result = await createCustomPropertyAction({
          action: 'add',
          blockId,
          workspaceId: 'workspace-id', // TODO: Get from context
          name: duplicatedProperty.name,
          propertyType: duplicatedProperty.type as any,
          options: duplicatedProperty.options,
        });

        if (!result.success) {
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

      const originalData = blockNode.data;
      const updatedData = updatePropertyInArray(
        originalData,
        'customProperties',
        propertyId,
        { options }
      );

      try {
        // Optimistic update
        updateNode(blockId, { data: updatedData });

        // Server action call
        const result = await updateCustomPropertyAction(propertyId, {
          workspaceId: 'workspace-id', // TODO: Get from context
          options,
        });

        if (!result.success) {
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
