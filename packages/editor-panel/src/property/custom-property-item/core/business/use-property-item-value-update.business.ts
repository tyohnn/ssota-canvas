import { useCallback } from 'react';
import type { CustomPropertyDefinitionLike } from '../types';

export interface UsePropertyItemValueUpdateDeps {
  updateProperty: (
    entityId: string,
    path: string,
    value: unknown,
    entityData: unknown
  ) => Promise<void>;
}

export interface UsePropertyItemValueUpdateArgs {
  entityId: string;
  property: CustomPropertyDefinitionLike;
  entityData: unknown;
}

export type UsePropertyItemValueUpdateResult = (
  nextValue: unknown
) => void;

/**
 * Single property value update mutation handler.
 */
export function usePropertyItemValueUpdate(
  { entityId, property, entityData }: UsePropertyItemValueUpdateArgs,
  { updateProperty }: UsePropertyItemValueUpdateDeps
): UsePropertyItemValueUpdateResult {
  return useCallback(
    (nextValue: unknown) => {
      void updateProperty(
        entityId,
        `properties.${property.id}`,
        nextValue,
        entityData
      );
    },
    [entityId, property.id, entityData, updateProperty]
  );
}
