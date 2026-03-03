import { useCallback } from 'react';

export interface UseAddPopoverNameInputDeps {
  validate?: (name: string) => string | null;
}

/**
 * Name validation/normalize.
 */
export function useAddPopoverNameInput({
  validate,
}: UseAddPopoverNameInputDeps): (name: string) => string | null {
  return useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return 'Property name is required';
      if (trimmed.length > 50) return 'Property name is too long (max 50 characters)';
      return validate?.(trimmed) ?? null;
    },
    [validate]
  );
}
