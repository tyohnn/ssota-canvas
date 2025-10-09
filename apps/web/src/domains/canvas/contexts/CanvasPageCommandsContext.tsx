'use client';

import React, { createContext, useContext } from 'react';
import { useCanvasPageCommands } from '../hooks/useCanvasPageCommands';

const CanvasPageCommandsContext = createContext<ReturnType<
  typeof useCanvasPageCommands
> | null>(null);

export function useCanvasPageCommandsContext() {
  const ctx = useContext(CanvasPageCommandsContext);
  if (!ctx)
    throw new Error(
      'useCanvasPageCommandsContext must be used within a CanvasPageCommandsProvider'
    );
  return ctx;
}

export function CanvasPageCommandsProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  const commands = useCanvasPageCommands(workspaceId);

  return (
    <CanvasPageCommandsContext.Provider value={commands}>
      {children}
    </CanvasPageCommandsContext.Provider>
  );
}
