import { useEffect } from 'react';
import type { CustomPropertyDefinitionLike } from '../types';

export interface UsePropertyItemAutofocusArgs {
  property: CustomPropertyDefinitionLike;
  lastAddedPropertyId: string | null;
  setLastAddedPropertyId: (id: string | null) => void;
  setPopoverOpen: (open: boolean) => void;
}

/**
 * If this property is the recently-added one, auto-open popover and reset flag.
 */
export function usePropertyItemAutofocus({
  property,
  lastAddedPropertyId,
  setLastAddedPropertyId,
  setPopoverOpen,
}: UsePropertyItemAutofocusArgs): void {
  useEffect(() => {
    if (lastAddedPropertyId === property.id) {
      setPopoverOpen(true);
      setLastAddedPropertyId(null);
    }
  }, [lastAddedPropertyId, property.id, setLastAddedPropertyId, setPopoverOpen]);
}
