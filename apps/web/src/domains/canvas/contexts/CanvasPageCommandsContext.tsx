'use client';

import React, { createContext, useContext } from 'react';
import { useCanvasPageCommands } from '../hooks/useCanvasPageCommands';

const CanvasPageCommandsContext = createContext<ReturnType<
  typeof useCanvasPageCommands
> | null>(null);

/**
 * Retrieves the canvas page commands context for the current React tree.
 *
 * @returns The context value containing canvas page command utilities and state.
 * @throws Error if called outside of a CanvasPageCommandsProvider.
 */
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