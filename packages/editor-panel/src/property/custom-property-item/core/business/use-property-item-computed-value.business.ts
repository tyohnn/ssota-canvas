import { useMemo } from 'react';
import type { CustomPropertyDefinitionLike } from '../types';

export interface UsePropertyItemComputedValueArgs {
  property: CustomPropertyDefinitionLike;
  propertyValues: Record<string, unknown>;
}

/**
 * propertyValues[property.id] + default fallback.
 */
export function usePropertyItemComputedValue({
  property,
  propertyValues,
}: UsePropertyItemComputedValueArgs): unknown {
  return useMemo(() => {
    const val = propertyValues[property.id];
    if (val !== undefined) return val;
    return property.defaultValue;
  }, [property.id, property.defaultValue, propertyValues]);
}
