'use client';

import { PropsWithChildren } from 'react';
import { AddOptionContext } from './context';
import { useAddOption } from './use-add-option';

export function AddOptionProvider({ children }: PropsWithChildren) {
  const value = useAddOption();
  return (
    <AddOptionContext.Provider value={value}>
      {children}
    </AddOptionContext.Provider>
  );
}
