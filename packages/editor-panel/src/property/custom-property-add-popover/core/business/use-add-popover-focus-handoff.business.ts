import { useCallback } from 'react';

export interface UseAddPopoverFocusHandoffDeps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  setOpen: (open: boolean) => void;
  setPropertyName: (name: string) => void;
  setIcon: (icon: string | null) => void;
}

/**
 * On error: restore state, reopen, focus input.
 * On success: reset form.
 */
export function useAddPopoverFocusHandoff({
  inputRef,
  setOpen,
  setPropertyName,
  setIcon,
}: UseAddPopoverFocusHandoffDeps): {
  onError: (context: {
    previousName: string;
    previousIcon: string | null;
  }) => void;
  onSuccess: () => void;
} {
  const onError = useCallback(
    (context: { previousName: string; previousIcon: string | null }) => {
      setOpen(true);
      setPropertyName(context.previousName);
      setIcon(context.previousIcon);
      inputRef.current?.focus();
    },
    [inputRef, setOpen, setPropertyName, setIcon]
  );

  const onSuccess = useCallback(() => {
    setPropertyName('');
    setIcon(null);
  }, [setPropertyName, setIcon]);

  return { onError, onSuccess };
}
