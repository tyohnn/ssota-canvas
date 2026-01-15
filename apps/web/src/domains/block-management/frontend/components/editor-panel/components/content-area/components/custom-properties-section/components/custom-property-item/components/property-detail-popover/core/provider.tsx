import type { PropsWithChildren } from 'react';
import { DetailPopoverContext } from './context';
import { useDetailPopover } from './use-detail-popover';
import type { DetailPopoverField } from './types';

export interface DetailPopoverProviderProps extends PropsWithChildren {
  blockId: string;
  field: DetailPopoverField;
}

export function DetailPopoverProvider({
  blockId,
  field,
  children,
}: DetailPopoverProviderProps) {
  const value = useDetailPopover(blockId, field);

  return (
    <DetailPopoverContext.Provider value={value}>
      {children}
    </DetailPopoverContext.Provider>
  );
}
