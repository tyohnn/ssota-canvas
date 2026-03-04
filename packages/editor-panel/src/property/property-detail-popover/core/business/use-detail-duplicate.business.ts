import { useCallback } from 'react';
import type { DetailPopoverFieldLike } from '../types';

export interface UseDetailDuplicateDeps {
  duplicateProperty: (entityId: string, propertyId: string) => Promise<void>;
  onRequestClose: () => void;
}

export interface UseDetailDuplicateArgs {
  entityId: string;
  field: DetailPopoverFieldLike;
}

export type UseDetailDuplicateResult = () => Promise<void>;

/**
 * Duplicate property, then close popover.
 */
export function useDetailDuplicate(
  { entityId, field }: UseDetailDuplicateArgs,
  { duplicateProperty, onRequestClose }: UseDetailDuplicateDeps
): UseDetailDuplicateResult {
  return useCallback(async () => {
    try {
      await duplicateProperty(entityId, field.id);
      onRequestClose();
    } catch (error) {
      console.error('Failed to duplicate property:', error);
    }
  }, [entityId, field.id, duplicateProperty, onRequestClose]);
}
