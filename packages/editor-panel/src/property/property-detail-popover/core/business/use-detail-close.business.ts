import { useCallback } from 'react';

export interface UseDetailCloseDeps {
  onRequestClose: () => void;
}

export type UseDetailCloseResult = (event: React.KeyboardEvent) => void;

/**
 * Escape key -> close callback.
 */
export function useDetailClose({
  onRequestClose,
}: UseDetailCloseDeps): UseDetailCloseResult {
  return useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onRequestClose();
      }
    },
    [onRequestClose]
  );
}
