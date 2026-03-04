import { useCallback, useEffect, useState } from 'react';
import type { DetailPopoverFieldLike } from '../types';

export interface UseDetailIconSaveDeps {
  saveIcon: (
    entityId: string,
    propertyId: string,
    icon: string | null
  ) => Promise<void>;
}

export interface UseDetailIconSaveArgs {
  entityId: string;
  field: DetailPopoverFieldLike;
}

export interface UseDetailIconSaveResult {
  icon: string | null;
  setIcon: (value: string | null) => void;
}

/**
 * Icon optimistic save + rollback on error.
 */
export function useDetailIconSave(
  { entityId, field }: UseDetailIconSaveArgs,
  { saveIcon }: UseDetailIconSaveDeps
): UseDetailIconSaveResult {
  const [icon, setIconState] = useState<string | null>(field.icon ?? null);

  useEffect(() => {
    setIconState(field.icon ?? null);
  }, [field.icon]);

  const setIcon = useCallback(
    (nextIcon: string | null) => {
      setIconState(nextIcon);
      saveIcon(entityId, field.id, nextIcon).catch(error => {
        console.error('Failed to save icon:', error);
        setIconState(field.icon ?? null);
      });
    },
    [entityId, field.id, field.icon, saveIcon]
  );

  return { icon, setIcon };
}
