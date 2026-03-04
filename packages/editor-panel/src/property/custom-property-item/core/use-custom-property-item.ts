import { useMemo } from 'react';
import type { PropertyDetailPopoverDeps } from '../../property-detail-popover/core/types';
import type { CustomPropertyDefinitionLike } from './types';
import { useCustomPropertyItemUI } from './use-custom-property-item.ui';
import { usePropertyItemValueUpdate } from './business/use-property-item-value-update.business';
import { usePropertyItemComputedValue } from './business/use-property-item-computed-value.business';
import { usePropertyItemAutofocus } from './business/use-property-item-autofocus.business';

export interface CustomPropertyItemDeps {
  entityId: string;
  resolvedEntityData: unknown;
  propertyValues: Record<string, unknown>;
  updateProperty: (
    entityId: string,
    path: string,
    value: unknown,
    entityData: unknown
  ) => Promise<void>;
  lastAddedPropertyId: string | null;
  setLastAddedPropertyId: (id: string | null) => void;
  detailPopoverDeps: PropertyDetailPopoverDeps;
}

export interface UseCustomPropertyItemArgs {
  property: CustomPropertyDefinitionLike;
  deps: CustomPropertyItemDeps;
}

export interface UseCustomPropertyItemResult {
  property: CustomPropertyDefinitionLike;
  value: unknown;
  isPopoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onValueChange: (nextValue: unknown) => void;
}

/**
 * Orchestration: UI + business hooks.
 */
export function useCustomPropertyItem({
  property,
  deps,
}: UseCustomPropertyItemArgs): UseCustomPropertyItemResult {
  const { isPopoverOpen, setPopoverOpen } = useCustomPropertyItemUI();

  usePropertyItemAutofocus({
    property,
    lastAddedPropertyId: deps.lastAddedPropertyId,
    setLastAddedPropertyId: deps.setLastAddedPropertyId,
    setPopoverOpen,
  });

  const value = usePropertyItemComputedValue({
    property,
    propertyValues: deps.propertyValues,
  });

  const onValueChange = usePropertyItemValueUpdate(
    {
      entityId: deps.entityId,
      property,
      entityData: deps.resolvedEntityData,
    },
    { updateProperty: deps.updateProperty }
  );

  return useMemo(
    () => ({
      property,
      value,
      isPopoverOpen,
      onPopoverOpenChange: setPopoverOpen,
      onValueChange,
    }),
    [property, value, isPopoverOpen, setPopoverOpen, onValueChange]
  );
}
