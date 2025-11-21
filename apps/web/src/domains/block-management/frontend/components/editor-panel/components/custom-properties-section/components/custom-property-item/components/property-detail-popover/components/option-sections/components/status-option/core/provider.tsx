'use client';

import { PropsWithChildren } from 'react';
import { AddStatusOptionContext } from './context';
import { useAddStatusOption } from './use-add-status-option';

export function AddStatusOptionProvider({ children }: PropsWithChildren) {
  const value = useAddStatusOption();
  return (
    <AddStatusOptionContext.Provider value={value}>
      {children}
    </AddStatusOptionContext.Provider>
  );
}
