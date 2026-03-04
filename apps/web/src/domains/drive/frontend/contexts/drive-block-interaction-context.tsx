'use client';

import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';

import type { BlockInteractions } from '@/domains/source-management/frontend/adapters/contracts/runtime-deps';

export interface DriveBlockInteractionContextValue {
  registerBlockInteractions: (
    blockId: string,
    interactions: BlockInteractions
  ) => void;
  unregisterBlockInteractions: (blockId: string) => void;
  getBlockInteractions: (blockId: string) => BlockInteractions | undefined;
}

const DriveBlockInteractionContext =
  createContext<DriveBlockInteractionContextValue | null>(null);

interface DriveBlockInteractionProviderProps {
  children: ReactNode;
}

/**
 * Drive block interaction provider.
 * Lets the left preview (YouTube/Audio) register seekTo and the right panel
 * timeline tab resolve it by blockMountId so timeline clicks seek the preview.
 * Uses a ref for the map so register/unregister do not cause re-renders and
 * infinite loops in consumers that depend on the context value.
 */
export function DriveBlockInteractionProvider({
  children,
}: DriveBlockInteractionProviderProps) {
  const mapRef = useRef<Map<string, BlockInteractions>>(new Map());

  const registerBlockInteractions = useCallback(
    (blockId: string, interactions: BlockInteractions) => {
      mapRef.current.set(blockId, interactions);
    },
    []
  );

  const unregisterBlockInteractions = useCallback((blockId: string) => {
    mapRef.current.delete(blockId);
  }, []);

  const getBlockInteractions = useCallback(
    (blockId: string): BlockInteractions | undefined =>
      mapRef.current.get(blockId),
    []
  );

  const value = useMemo(
    () => ({
      registerBlockInteractions,
      unregisterBlockInteractions,
      getBlockInteractions,
    }),
    [registerBlockInteractions, unregisterBlockInteractions, getBlockInteractions]
  );

  return (
    <DriveBlockInteractionContext.Provider value={value}>
      {children}
    </DriveBlockInteractionContext.Provider>
  );
}

export function useDriveBlockInteraction(): DriveBlockInteractionContextValue | null {
  return useContext(DriveBlockInteractionContext);
}
