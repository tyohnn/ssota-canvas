import { useCallback, useState } from 'react';
import type { PropertyTypeLike } from './types';
import type { CustomPropertyAddPopoverDeps } from './types';
import { useCustomPropertyAddPopoverUI } from './use-custom-property-add-popover.ui';
import { useAddPopoverNameInput } from './business/use-add-popover-name-input.business';
import { useAddPopoverCreateProperty } from './business/use-add-popover-create-property.business';
import { useAddPopoverFocusHandoff } from './business/use-add-popover-focus-handoff.business';

export interface UseCustomPropertyAddPopoverArgs {
  entityId: string;
  deps: CustomPropertyAddPopoverDeps;
}

export interface UseCustomPropertyAddPopoverResult {
  open: boolean;
  propertyName: string;
  icon: string | null;
  handleOpenChange: (open: boolean) => void;
  handleSelectType: (type: PropertyTypeLike, fallbackName: string) => Promise<void>;
  setPropertyName: (name: string) => void;
  setIcon: (icon: string | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Orchestration: UI + business hooks.
 */
export function useCustomPropertyAddPopover({
  entityId,
  deps,
}: UseCustomPropertyAddPopoverArgs): UseCustomPropertyAddPopoverResult {
  const ui = useCustomPropertyAddPopoverUI();
  const validate = useAddPopoverNameInput({ validate: deps.validate });
  const createProperty = useAddPopoverCreateProperty({
    onSubmit: deps.onSubmit,
    onSuccess: deps.onSuccess,
  });
  const { onError, onSuccess } = useAddPopoverFocusHandoff({
    inputRef: ui.inputRef,
    setOpen: ui.setOpen,
    setPropertyName: ui.setPropertyName,
    setIcon: ui.setIcon,
  });

  const [isPending, setIsPending] = useState(false);

  const handleSelectType = useCallback(
    async (type: PropertyTypeLike, fallbackName: string) => {
      const trimmedName = ui.propertyName.trim();
      const finalName = trimmedName || fallbackName.trim();

      const error = validate(finalName);
      if (error) {
        ui.inputRef.current?.focus();
        return;
      }

      setIsPending(true);
      const previousName = ui.propertyName;
      const previousIcon = ui.icon;
      ui.setOpen(false);

      try {
        await createProperty({ type, name: finalName, icon: ui.icon });
        onSuccess();
      } catch (err) {
        console.error('Failed to create property:', err);
        onError({ previousName, previousIcon });
      } finally {
        setIsPending(false);
      }
    },
    [
      ui.propertyName,
      ui.icon,
      ui.setOpen,
      ui.inputRef,
      validate,
      createProperty,
      onError,
      onSuccess,
    ]
  );

  return {
    open: ui.open,
    propertyName: ui.propertyName,
    icon: ui.icon,
    handleOpenChange: ui.handleOpenChange,
    handleSelectType,
    setPropertyName: ui.setPropertyName,
    setIcon: ui.setIcon,
    inputRef: ui.inputRef,
  };
}
