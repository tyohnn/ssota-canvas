/**
 * Canvas History - Reducer
 * 
 * History State를 관리하는 Reducer
 */

import type { CanvasHistoryState, CanvasOperation, HistoryEntry } from './types';

/**
 * History Actions
 */
export type HistoryAction =
  | { type: 'RECORD_OPERATION'; operation: CanvasOperation }
  | { type: 'START_BATCH' }
  | { type: 'END_BATCH'; description?: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' };

/**
 * Initial State
 */
export const initialHistoryState: CanvasHistoryState = {
  past: [],
  future: [],
  currentBatch: null,
};

/**
 * History Reducer
 */
export function canvasHistoryReducer(
  state: CanvasHistoryState,
  action: HistoryAction
): CanvasHistoryState {
  // 모든 액션을 상세히 로깅 (state 변화 추적용)
  console.log(`[HistoryReducer] ${action.type}`, {
    past: state.past.length,
    future: state.future.length,
    hasBatch: !!state.currentBatch,
    action
  });
  
  switch (action.type) {
    case 'RECORD_OPERATION': {
      if (state.currentBatch !== null) {
        return {
          ...state,
          currentBatch: [...state.currentBatch, action.operation],
        };
      }

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        operations: [action.operation],
      };

      return {
        ...state,
        past: [...state.past, entry],
        future: [],
      };
    }

    case 'START_BATCH': {
      return {
        ...state,
        currentBatch: [],
      };
    }

    case 'END_BATCH': {
      if (state.currentBatch === null || state.currentBatch.length === 0) {
        return {
          ...state,
          currentBatch: null,
        };
      }

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        operations: state.currentBatch,
        description: action.description,
      };

      return {
        ...state,
        past: [...state.past, entry],
        future: [],
        currentBatch: null,
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;

      const lastEntry = state.past[state.past.length - 1];
      if (!lastEntry) return state;

      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [lastEntry, ...state.future],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;

      const nextEntry = state.future[0];
      if (!nextEntry) return state;

      return {
        ...state,
        past: [...state.past, nextEntry],
        future: state.future.slice(1),
      };
    }

    case 'CLEAR': {
      return initialHistoryState;
    }

    default:
      return state;
  }
}
