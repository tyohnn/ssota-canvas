import { useCallback, useMemo, useState, useEffect } from 'react';
import type { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { useBlockPropertyUpdate } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import { useCustomPropertiesSectionContext } from '../../../core/context';
import type { CustomPropertyItemContextValue } from './context';

export function useCustomPropertyItem(
  property: CustomPropertyDefinition
): CustomPropertyItemContextValue {
  const {
    blockId,
    resolvedBlockData,
    propertyValues,
    lastAddedPropertyId,
    setLastAddedPropertyId,
  } = useCustomPropertiesSectionContext();

  const { updateProperty } = useBlockPropertyUpdate();
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Auto-open popover when this property is the last added one
  useEffect(() => {
    if (lastAddedPropertyId === property.id) {
      setPopoverOpen(true);
      setLastAddedPropertyId(null);
    }
  }, [lastAddedPropertyId, property.id, setLastAddedPropertyId]);

  const handleValueChange = useCallback(
    (nextValue: unknown) => {
      void updateProperty(
        blockId,
        `properties.${property.id}`,
        nextValue,
        resolvedBlockData
      );
    },
    [blockId, property.id, resolvedBlockData, updateProperty]
  );

  const value = useMemo(
    () => propertyValues[property.id],
    [property.id, propertyValues]
  );

  return {
    blockId,
    property,
    value,
    handleValueChange,
    popoverOpen,
    setPopoverOpen,
  };
}
