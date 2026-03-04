import { useEffect } from 'react';
import type { DetailPopoverFieldLike } from '../types';

export interface UseDetailLabelSaveDeps {
  saveLabel: (
    entityId: string,
    propertyId: string,
    label: string
  ) => Promise<void>;
}

export interface UseDetailLabelSaveArgs {
  entityId: string;
  field: DetailPopoverFieldLike;
  label: string;
}

/**
 * Debounced label save + unmount flush.
 */
export function useDetailLabelSave(
  { entityId, field, label }: UseDetailLabelSaveArgs,
  { saveLabel }: UseDetailLabelSaveDeps
): void {
  useEffect(() => {
    if (label === field.name) return;

    const timeoutId = setTimeout(() => {
      saveLabel(entityId, field.id, label).catch(error => {
        console.error('Failed to save label:', error);
      });
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (label !== field.name) {
        saveLabel(entityId, field.id, label).catch(() => {});
      }
    };
  }, [label, field.name, field.id, entityId, saveLabel]);
}
