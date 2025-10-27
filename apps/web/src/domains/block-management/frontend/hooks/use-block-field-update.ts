'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { updateBlockAction } from '../../actions/block.actions';
import { useBlockStateUpdate } from './use-block-state-update';

export interface UseBlockFieldUpdateResult {
  updateField: (
    blockId: string,
    fieldPath: string,
    value: any
  ) => Promise<void>;
  updateFieldImmediate: (
    blockId: string,
    fieldPath: string,
    value: any
  ) => void;
  resetField: (blockId: string, fieldPath: string) => Promise<void>;
}

/**
 * Block 속성 값 업데이트를 처리하는 Hook
 *
 * - Optimistic Update: React Flow Store 즉시 업데이트
 * - Server Action 호출: 백그라운드 DB 동기화
 * - 실패 시 롤백
 */
export function useBlockFieldUpdate(): UseBlockFieldUpdateResult {
  const { getNode, updateNode } = useReactFlow();
  const { updateBlockRenderState } = useBlockStateUpdate();

  const updateField = useCallback(
    async (blockId: string, fieldPath: string, value: any): Promise<void> => {
      // Get current block data
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      // Store original data for rollback
      const originalData = blockNode.data;

      console.log('[updateField] BEFORE UPDATE:', {
        blockId,
        fieldPath,
        value,
        originalData: JSON.parse(JSON.stringify(originalData)),
      });

      // Update nested property using dot notation
      const updatedData = updateNestedProperty(originalData, fieldPath, value);

      console.log('[updateField] AFTER UPDATE:', {
        updatedData: JSON.parse(JSON.stringify(updatedData)),
      });

      try {
        // Optimistic update
        updateNode(blockId, { data: updatedData });

        // Update block render state based on new properties
        const blockType = blockNode.data.blockType as string;
        const newProperties = updatedData.properties || {};
        updateBlockRenderState(blockId, blockType, newProperties);

        // Server action call - use actual DB blockId from block data
        const actualBlockId = (originalData.blockId as string) || blockId;
        const extractedProperties = extractMetadataFromData(
          updatedData,
          fieldPath
        );

        console.log('[updateField] SERVER ACTION PAYLOAD:', {
          actualBlockId,
          properties: extractedProperties,
        });

        const result = await updateBlockAction({
          blockId: actualBlockId,
          properties: extractedProperties,
        });

        if (!result.success) {
          // Rollback on failure
          updateNode(blockId, { data: originalData });
          // Rollback render state
          updateBlockRenderState(
            blockId,
            blockType,
            originalData.properties || {}
          );
          throw new Error(result.error || 'Failed to update block');
        }
      } catch (error) {
        // Rollback on error
        updateNode(blockId, { data: originalData });
        throw error;
      }
    },
    [getNode, updateNode, updateBlockRenderState]
  );

  const updateFieldImmediate = useCallback(
    (blockId: string, fieldPath: string, value: any): void => {
      // Get current block data
      const blockNode = getNode(blockId);
      if (!blockNode) {
        console.error('[updateFieldImmediate] Block not found:', blockId);
        return;
      }

      console.log('[updateFieldImmediate] Updating:', {
        blockId,
        fieldPath,
        value,
        currentData: blockNode.data,
      });

      // Update nested property using dot notation
      const updatedData = updateNestedProperty(
        blockNode.data,
        fieldPath,
        value
      );

      console.log('[updateFieldImmediate] Updated data:', updatedData);

      // Optimistic update only (no server action)
      updateNode(blockId, { data: updatedData });

      // Update block render state based on new properties
      const blockType = blockNode.data.blockType as string;
      const newProperties = updatedData.properties || {};
      updateBlockRenderState(blockId, blockType, newProperties);

      console.log(
        '[updateFieldImmediate] React Flow node updated successfully'
      );
    },
    [getNode, updateNode, updateBlockRenderState]
  );

  const resetField = useCallback(
    async (blockId: string, fieldPath: string): Promise<void> => {
      await updateField(blockId, fieldPath, null);
    },
    [updateField]
  );

  return {
    updateField,
    updateFieldImmediate,
    resetField,
  };
}

/**
 * Update nested property using dot notation
 * Special handling for 'properties' to prevent infinite nesting
 */
function updateNestedProperty(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const result = { ...obj };

  let current: any = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key) {
      // Ensure the key exists
      if (!(key in current)) {
        current[key] = {};
      } else if (typeof current[key] !== 'object' || current[key] === null) {
        // If existing value is not an object, replace it with an empty object
        current[key] = {};
      } else {
        // Shallow copy the nested object
        const existingValue = current[key];

        // Special handling for 'properties' key: remove nested 'properties' if it exists
        if (key === 'properties' && existingValue.properties) {
          const { properties: nestedProperties, ...cleanedValue } =
            existingValue;
          current[key] = { ...cleanedValue };
        } else {
          current[key] = { ...existingValue };
        }
      }
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
 * Extract metadata from updated data for server action
 * Converts React Flow node data path (e.g., "properties.content")
 * to DB format (e.g., { content: "..." })
 */
function extractMetadataFromData(
  data: any,
  fieldPath: string
): Record<string, any> {
  const keys = fieldPath.split('.');

  // Special case: if path starts with "properties", we need to extract from node data
  // and return DB format (without "properties" wrapper)
  if (keys[0] === 'properties' && keys.length > 1) {
    // Navigate to the value in node data
    let current = data;
    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key];
      }
    }

    // Return DB format: { fieldName: value }
    const fieldName = keys[keys.length - 1];
    if (!fieldName) {
      return {};
    }
    return {
      [fieldName]: current,
    };
  }

  // For other paths, use the original logic
  const result: Record<string, any> = {};
  let current = data;
  let resultCurrent: any = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key) {
      if (!resultCurrent[key]) {
        resultCurrent[key] = {};
      }
      current = current[key];
      resultCurrent = resultCurrent[key];
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey && current) {
    resultCurrent[lastKey] = current[lastKey];
  }

  return result;
}
