import { createContext, useContext } from 'react';
import type { PropertyOption } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export interface AddStatusOptionContextValue {
  isAddPopoverOpen: boolean;
  pendingOption: PropertyOption | null;
  handleAddOption: (groupId: string) => Promise<void>;
  handleClosePopover: () => void;
  handlePopoverOpenChange: (open: boolean) => void;
}

export const AddStatusOptionContext =
  createContext<AddStatusOptionContextValue | null>(null);

export function useAddStatusOptionContext() {
  const context = useContext(AddStatusOptionContext);
  if (!context) {
    throw new Error(
      'useAddStatusOptionContext must be used within AddStatusOptionProvider'
    );
  }
  return context;
}
