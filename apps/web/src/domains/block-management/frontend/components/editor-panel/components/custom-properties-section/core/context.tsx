import { createContext, useContext } from 'react';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export interface CustomPropertiesSectionContextValue {
  blockId: string;
  resolvedBlockData: BlockNodeData;
  customProperties: CustomPropertyDefinition[];
  propertyValues: Record<string, unknown>;
  lastAddedPropertyId: string | null;
  setLastAddedPropertyId: (id: string | null) => void;
}

export const CustomPropertiesSectionContext =
  createContext<CustomPropertiesSectionContextValue | null>(null);

export function useCustomPropertiesSectionContext(): CustomPropertiesSectionContextValue {
  const context = useContext(CustomPropertiesSectionContext);
  if (!context) {
    throw new Error(
      'useCustomPropertiesSectionContext must be used within CustomPropertiesSection'
    );
  }
  return context;
}
