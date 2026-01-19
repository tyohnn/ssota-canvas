'use client';

import React, { createContext, useContext, useMemo } from 'react';

/**
 * Canvas ReadOnly Context Value
 */
export interface CanvasReadOnlyContextValue {
  readonly: boolean;
  canEdit: () => boolean;
  canDelete: () => boolean;
  canCreate: () => boolean;
}

const CanvasReadOnlyContext = createContext<
  CanvasReadOnlyContextValue | undefined
>(undefined);

/**
 * Canvas ReadOnly Provider Props
 */
export interface CanvasReadOnlyProviderProps {
  readonly: boolean;
  children: React.ReactNode;
}

/**
 * Canvas ReadOnly Provider
 *
 * Provides readonly state to all child components
 */
export function CanvasReadOnlyProvider({
  readonly,
  children,
}: CanvasReadOnlyProviderProps) {
  const value = useMemo<CanvasReadOnlyContextValue>(
    () => ({
      readonly,
      canEdit: () => !readonly,
      canDelete: () => !readonly,
      canCreate: () => !readonly,
    }),
    [readonly]
  );

  return (
    <CanvasReadOnlyContext.Provider value={value}>
      {children}
    </CanvasReadOnlyContext.Provider>
  );
}

/**
 * Hook to access Canvas ReadOnly context
 *
 * @throws Error if used outside of CanvasReadOnlyProvider
 */
export function useCanvasReadOnly(): CanvasReadOnlyContextValue {
  const context = useContext(CanvasReadOnlyContext);
  if (context === undefined) {
    throw new Error(
      'useCanvasReadOnly must be used within a CanvasReadOnlyProvider'
    );
  }
  return context;
}
