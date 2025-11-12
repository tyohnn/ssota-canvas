import { createContext, useContext } from 'react';
import type { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export interface CustomPropertyAddPopoverContextValue {
  blockId: string;
  open: boolean;
  propertyName: string;
  setPropertyName: (value: string) => void;
  icon: string | null;
  setIcon: (value: string | null) => void;
  handleSelectType: (type: PropertyType, fallbackName: string) => Promise<void>;
  handleOpenChange: (nextOpen: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const CustomPropertyAddPopoverContext =
  createContext<CustomPropertyAddPopoverContextValue | null>(null);

export function useCustomPropertyAddPopoverContext(): CustomPropertyAddPopoverContextValue {
  const context = useContext(CustomPropertyAddPopoverContext);
  if (!context) {
    throw new Error(
      'usePropertyAddPopoverContext must be used within PropertyAddPopover'
    );
  }
  return context;
}
