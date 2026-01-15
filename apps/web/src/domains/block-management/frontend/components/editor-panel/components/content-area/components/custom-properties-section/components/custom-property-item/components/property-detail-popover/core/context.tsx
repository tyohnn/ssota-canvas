import { createContext, useContext } from 'react';
import type { DetailPopoverField } from './types';

export interface DetailPopoverContextValue {
  blockId: string;
  field: DetailPopoverField;
  label: string;
  setLabel: (value: string) => void;
  icon: string | null;
  setIcon: (value: string | null) => void;
  handleDuplicate: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

export const DetailPopoverContext =
  createContext<DetailPopoverContextValue | null>(null);

export function useDetailPopoverContext(): DetailPopoverContextValue {
  const context = useContext(DetailPopoverContext);
  if (!context) {
    throw new Error(
      'useDetailPopoverContext must be used within DetailPopover'
    );
  }
  return context;
}
