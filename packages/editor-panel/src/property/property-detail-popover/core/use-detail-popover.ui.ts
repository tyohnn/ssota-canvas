import { useEffect, useState } from 'react';
import type { DetailPopoverFieldLike } from './types';

export interface UseDetailPopoverUIArgs {
  field: DetailPopoverFieldLike;
}

export interface UseDetailPopoverUIResult {
  label: string;
  setLabel: (value: string) => void;
}

/**
 * Local label state, synced with field.name when it changes externally.
 */
export function useDetailPopoverUI({
  field,
}: UseDetailPopoverUIArgs): UseDetailPopoverUIResult {
  const [label, setLabel] = useState(field.name);

  useEffect(() => {
    setLabel(field.name);
  }, [field.name]);

  return { label, setLabel };
}
