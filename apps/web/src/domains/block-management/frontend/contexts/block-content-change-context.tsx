'use client';

import { createContext, useContext } from 'react';

/**
 * Optional callback when block content changes (e.g. user types in note editor).
 * Used by tutorial layer to advance steps on typing without block-management depending on tutorial-management.
 */
export interface BlockContentChangeContextValue {
  onContentChange?: () => void;
}

export const BlockContentChangeContext =
  createContext<BlockContentChangeContextValue | null>(null);

export function useBlockContentChangeContext(): BlockContentChangeContextValue | null {
  return useContext(BlockContentChangeContext);
}
