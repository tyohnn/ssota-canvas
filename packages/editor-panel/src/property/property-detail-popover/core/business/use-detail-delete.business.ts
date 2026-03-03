import { useCallback } from 'react';
import type { DetailPopoverFieldLike } from '../types';

export interface UseDetailDeleteDeps {
  deleteProperty: (entityId: string, propertyId: string) => Promise<void>;
  onRequestClose: () => void;
}

export interface UseDetailDeleteArgs {
  entityId: string;
  field: DetailPopoverFieldLike;
}

export type UseDetailDeleteResult = () => Promise<void>;

/**
 * Delete property, then close popover.
 */
export function useDetailDelete(
  { entityId, field }: UseDetailDeleteArgs,
  { deleteProperty, onRequestClose }: UseDetailDeleteDeps
): UseDetailDeleteResult {
  return useCallback(async () => {
    try {
      await deleteProperty(entityId, field.id);
      onRequestClose();
    } catch (error) {
      console.error('Failed to delete property:', error);
    }
  }, [entityId, field.id, deleteProperty, onRequestClose]);
}
