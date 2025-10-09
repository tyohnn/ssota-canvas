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

/**
 * Apply a selection-related action to the current selection state and produce the next state.
 *
 * @param state - The current selection state to transition from.
 * @param action - The action describing the selection change (select a page, select a component, or clear all selections).
 * @returns The updated SelectionState after the action is applied.
 */
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

/**
 * Provides selection state and actions for managing selected pages and components in the canvas.
 *
 * @returns An object containing:
 * - `state` — the current selection state (`selectedPageId`, `selectedComponentId`, `selectedPageBlock`, `selectedComponentBlock`).
 * - `canvasMode` — `'component'` when a component is selected, otherwise `'page'`.
 * - `selectPage` — function to set or clear the selected page by id (`id: string | null`).
 * - `selectComponent` — function to set or clear the selected component by id (`id: string | null`).
 * - `clearAll` — function to reset all selection fields to `null`.
 */
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