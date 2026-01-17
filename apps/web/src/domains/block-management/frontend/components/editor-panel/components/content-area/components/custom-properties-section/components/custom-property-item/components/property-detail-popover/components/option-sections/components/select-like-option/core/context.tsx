import { createContext, useContext } from 'react';
import type { PropertyOption } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export interface AddOptionContextValue {
  isAddPopoverOpen: boolean;
  pendingOption: PropertyOption | null;
  popoverTriggerRef: React.RefObject<HTMLButtonElement | null>;
  handleAddOption: () => Promise<void>;
  handleClosePopover: () => void;
  handlePopoverOpenChange: (open: boolean) => void;
}

export const AddOptionContext = createContext<AddOptionContextValue | null>(
  null
);

export function useAddOptionContext() {
  const context = useContext(AddOptionContext);
  if (!context) {
    throw new Error(
      'useAddOptionContext must be used within AddOptionProvider'
    );
  }
  return context;
}
