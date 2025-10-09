'use client';

import { Block } from '@/db/schema';
import { useCallback, useReducer, useMemo } from 'react';

export type CanvasMode = 'page' | 'component';

export type SelectionState = {
  selectedPageId: string | null;
  selectedComponentId: string | null;
  selectedPageBlock: Block | null;
  selectedComponentBlock: Block | null;
};

type Action =
  | { type: 'SELECT_PAGE'; payload: { id: string | null } }
  | { type: 'SELECT_COMPONENT'; payload: { id: string | null } }
  | { type: 'CLEAR_ALL' };

const initial: SelectionState = {
  selectedPageId: null,
  selectedComponentId: null,
  selectedPageBlock: null,
  selectedComponentBlock: null,
};

function reducer(state: SelectionState, action: Action): SelectionState {
  switch (action.type) {
    case 'SELECT_PAGE':
      return { ...state, selectedPageId: action.payload.id };
    case 'SELECT_COMPONENT':
      return { ...state, selectedComponentId: action.payload.id };
    case 'CLEAR_ALL':
      return initial;
    default:
      return state;
  }
}

export function useSelectionStore() {
  const [state, dispatch] = useReducer(reducer, initial);

  const selectPage = useCallback(
    (id: string | null) => dispatch({ type: 'SELECT_PAGE', payload: { id } }),
    []
  );

  const selectComponent = useCallback(
    (id: string | null) =>
      dispatch({ type: 'SELECT_COMPONENT', payload: { id } }),
    []
  );

  const clearAll = useCallback(() => dispatch({ type: 'CLEAR_ALL' }), []);

  // Compute canvas mode based on selection
  const canvasMode = useMemo(() => {
    return state.selectedComponentId ? 'component' : 'page';
  }, [state.selectedComponentId]);

  return {
    state,
    canvasMode,
    selectPage,
    selectComponent,
    clearAll,
  } as const;
}
