/**
 * Workspace Library Provider
 *
 * Workspace Library Context Provider 컴포넌트
 */

'use client';

import { WorkspaceLibraryContext } from './context';
import { useWorkspaceLibrary } from './use-workspace-library';
import type { ReactNode } from 'react';

export interface WorkspaceLibraryProviderProps {
  children: ReactNode;
}

/**
 * Workspace Library Provider
 */
export function WorkspaceLibraryProvider({
  children,
}: WorkspaceLibraryProviderProps) {
  const contextValue = useWorkspaceLibrary();

  return (
    <WorkspaceLibraryContext.Provider value={contextValue}>
      {children}
    </WorkspaceLibraryContext.Provider>
  );
}
