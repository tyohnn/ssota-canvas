'use client';

import React, { createContext, useContext, useMemo } from 'react';

/**
 * Canvas ReadOnly Context Value
 */
export interface CanvasReadOnlyContextValue {
  readonly: boolean;
  publishToken?: string; // 퍼블릭 페이지용 publish token
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
  publishToken?: string;
  children: React.ReactNode;
}

/**
 * Canvas ReadOnly Provider
 *
 * Provides readonly state and publish token to all child components
 */
export function CanvasReadOnlyProvider({
  readonly,
  publishToken,
  children,
}: CanvasReadOnlyProviderProps) {
  const value = useMemo<CanvasReadOnlyContextValue>(
    () => ({
      readonly,
      publishToken,
      canEdit: () => !readonly,
      canDelete: () => !readonly,
      canCreate: () => !readonly,
    }),
    [readonly, publishToken]
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
