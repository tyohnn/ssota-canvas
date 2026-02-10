/**
 * Canvas History Context
 * 
 * Undo/Redo 기능을 위한 전역 상태 관리
 * 
 * 핵심 설계:
 * - Context는 state 관리만 담당
 * - 실제 operation 실행은 use-react-flow-wrapper에서 담당
 * - Undo/Redo 시 먼저 실행할 entry를 가져온 후 dispatch
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { canvasHistoryReducer, initialHistoryState, type HistoryAction } from './canvas-history.reducer';
import type { CanvasHistoryState, CanvasOperation, HistoryEntry } from './types';

/**
 * Context 타입 정의
 */
export interface CanvasHistoryContextType {
  // State
  state: CanvasHistoryState;
  
  // Actions
  recordOperation: (operation: CanvasOperation) => void;
  startBatch: () => void;
  endBatch: (description?: string) => void;
  
  // Undo/Redo - entry를 반환하여 외부에서 실행할 수 있게 함
  getUndoEntry: () => HistoryEntry | null;
  getRedoEntry: () => HistoryEntry | null;
  commitUndo: () => void;
  commitRedo: () => void;
  setIsSkipping: (skipping: boolean) => void;
  getIsSkipping: () => boolean;
  clear: () => void;
  
  // Computed
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Context 생성
 */
const CanvasHistoryContext = createContext<CanvasHistoryContextType | null>(null);

/**
 * Provider Props
 */
interface CanvasHistoryProviderProps {
  children: ReactNode;
}

/**
 * Canvas History Provider
 */
export function CanvasHistoryProvider({ children }: CanvasHistoryProviderProps) {
  const [state, dispatch] = useReducer(canvasHistoryReducer, initialHistoryState);
  // Undo/Redo 실행 중에는 기록을 스킵하기 위한 Ref
  const isSkippingRef = React.useRef(false);

  // Actions
  const recordOperation = useCallback((operation: CanvasOperation) => {
    if (isSkippingRef.current) {
      console.log('[CanvasHistory] Skipping record (Internal action):', operation.type);
      return;
    }
    console.log('[CanvasHistory] Recording operation:', operation.type);
    dispatch({ type: 'RECORD_OPERATION', operation });
  }, []);

  const startBatch = useCallback(() => {
    dispatch({ type: 'START_BATCH' });
  }, []);

  const endBatch = useCallback((description?: string) => {
    if (isSkippingRef.current) {
      console.log('[CanvasHistory] Skipping endBatch (Internal action)');
      return;
    }
    dispatch({ type: 'END_BATCH', description });
  }, []);

  // Undo 시 실행할 entry 가져오기 (state 변경 없이)
  const getUndoEntry = useCallback((): HistoryEntry | null => {
    if (state.past.length === 0) {
      return null;
    }
    return state.past[state.past.length - 1] || null;
  }, [state.past]);

  // Redo 시 실행할 entry 가져오기 (state 변경 없이)
  const getRedoEntry = useCallback((): HistoryEntry | null => {
    if (state.future.length === 0) {
      return null;
    }
    return state.future[0] || null;
  }, [state.future]);

  // Undo state 커밋 (operation 실행 후 호출)
  const commitUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  // Redo state 커밋 (operation 실행 후 호출)
  const commitRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const setIsSkipping = useCallback((skipping: boolean) => {
    console.log('[CanvasHistory] Setting skip status:', skipping);
    isSkippingRef.current = skipping;
  }, []);

  const getIsSkipping = useCallback(() => {
    return isSkippingRef.current;
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  // Computed values
  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const value: CanvasHistoryContextType = {
    state,
    recordOperation,
    startBatch,
    endBatch,
    getUndoEntry,
    getRedoEntry,
    commitUndo,
    commitRedo,
    setIsSkipping,
    getIsSkipping,
    clear,
    canUndo,
    canRedo,
  };

  return (
    <CanvasHistoryContext.Provider value={value}>
      {children}
    </CanvasHistoryContext.Provider>
  );
}

/**
 * Hook to use Canvas History
 */
export function useCanvasHistory(): CanvasHistoryContextType {
  const context = useContext(CanvasHistoryContext);
  
  if (!context) {
    throw new Error('useCanvasHistory must be used within CanvasHistoryProvider');
  }
  
  return context;
}
