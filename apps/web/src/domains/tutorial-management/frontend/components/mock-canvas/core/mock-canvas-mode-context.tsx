'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';

/**
 * Mock canvas mode (tutorial-only subset)
 */
export type MockCanvasMode =
  | { type: 'default' }
  | { type: 'block-creation'; blockType: BlockType };

export interface MockCanvasModeContextValue {
  mode: MockCanvasMode;
  enterBlockCreationMode: (blockType: BlockType) => void;
  exitToDefaultMode: () => void;
  isBlockCreationMode: () => boolean;
  getCurrentMode: () => MockCanvasMode;
}

const MockCanvasModeContext =
  createContext<MockCanvasModeContextValue | null>(null);

export function useMockCanvasMode(): MockCanvasModeContextValue {
  const ctx = useContext(MockCanvasModeContext);
  if (!ctx) {
    throw new Error(
      'useMockCanvasMode must be used within MockCanvasModeProvider'
    );
  }
  return ctx;
}

interface MockCanvasModeProviderProps {
  children: ReactNode;
}

export function MockCanvasModeProvider({ children }: MockCanvasModeProviderProps) {
  const [mode, setMode] = useState<MockCanvasMode>({ type: 'default' });

  const enterBlockCreationMode = useCallback((blockType: BlockType) => {
    setMode({ type: 'block-creation', blockType });
  }, []);

  const exitToDefaultMode = useCallback(() => {
    setMode({ type: 'default' });
  }, []);

  const isBlockCreationMode = useCallback(
    () => mode.type === 'block-creation',
    [mode.type]
  );

  const getCurrentMode = useCallback(() => mode, [mode]);

  const value = useMemo<MockCanvasModeContextValue>(
    () => ({
      mode,
      enterBlockCreationMode,
      exitToDefaultMode,
      isBlockCreationMode,
      getCurrentMode,
    }),
    [
      mode,
      enterBlockCreationMode,
      exitToDefaultMode,
      isBlockCreationMode,
      getCurrentMode,
    ]
  );

  return (
    <MockCanvasModeContext.Provider value={value}>
      {children}
    </MockCanvasModeContext.Provider>
  );
}
