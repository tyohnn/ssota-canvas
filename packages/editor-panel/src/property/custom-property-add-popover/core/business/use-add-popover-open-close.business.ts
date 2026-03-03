import { useCallback } from 'react';

export interface UseAddPopoverOpenCloseDeps {
  setOpen: (open: boolean) => void;
  setPropertyName: (name: string) => void;
  setIcon: (icon: string | null) => void;
}

/**
 * Open/close reset rules.
 */
export function useAddPopoverOpenClose({
  setOpen,
  setPropertyName,
  setIcon,
}: UseAddPopoverOpenCloseDeps): (open: boolean) => void {
  return useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        setPropertyName('');
        setIcon(null);
      }
    },
    [setOpen, setPropertyName, setIcon]
  );
}
