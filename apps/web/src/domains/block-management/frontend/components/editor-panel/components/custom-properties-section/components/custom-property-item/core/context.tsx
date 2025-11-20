import { createContext, useContext } from 'react';
import type { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export interface CustomPropertyItemContextValue {
  blockId: string;
  property: CustomPropertyDefinition;
  value: unknown;
  handleValueChange: (nextValue: unknown) => void;
  popoverOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
}

export const CustomPropertyItemContext =
  createContext<CustomPropertyItemContextValue | null>(null);

export function useCustomPropertyItemContext(): CustomPropertyItemContextValue {
  const context = useContext(CustomPropertyItemContext);
  if (!context) {
    throw new Error(
      'useCustomPropertyItemContext must be used within CustomPropertyItem'
    );
  }
  return context;
}
