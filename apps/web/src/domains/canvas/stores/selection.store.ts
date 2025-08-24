"use client";

import { useCallback, useReducer, useMemo } from "react";

export type SelectionState = {
  pageId: string | null;
  componentId: string | null;
  nodeIds: string[]; // XYFlow nodes selected
  edgeId: string | null;
};

type Action =
  | { type: "SELECT_PAGE"; payload: { id: string | null } }
  | { type: "SELECT_COMPONENT"; payload: { id: string | null } }
  | { type: "SET_NODE_SELECTION"; payload: { ids: string[] } }
  | { type: "SELECT_EDGE"; payload: { id: string | null } }
  | { type: "CLEAR_ALL" };

const initial: SelectionState = {
  pageId: null,
  componentId: null,
  nodeIds: [],
  edgeId: null,
};

function reducer(state: SelectionState, action: Action): SelectionState {
  switch (action.type) {
    case "SELECT_PAGE":
      return { ...state, pageId: action.payload.id };
    case "SELECT_COMPONENT":
      return { ...state, componentId: action.payload.id };
    case "SET_NODE_SELECTION":
      return { ...state, nodeIds: action.payload.ids };
    case "SELECT_EDGE":
      return { ...state, edgeId: action.payload.id };
    case "CLEAR_ALL":
      return initial;
    default:
      return state;
  }
}

export function useSelectionStore() {
  const [state, dispatch] = useReducer(reducer, initial);

  const selectPage = useCallback(
    (id: string | null) => dispatch({ type: "SELECT_PAGE", payload: { id } }),
    []
  );
  const selectComponent = useCallback(
    (id: string | null) =>
      dispatch({ type: "SELECT_COMPONENT", payload: { id } }),
    []
  );
  const setNodeSelection = useCallback(
    (ids: string[]) =>
      dispatch({ type: "SET_NODE_SELECTION", payload: { ids } }),
    []
  );
  const selectEdge = useCallback(
    (id: string | null) => dispatch({ type: "SELECT_EDGE", payload: { id } }),
    []
  );
  const clearAll = useCallback(() => dispatch({ type: "CLEAR_ALL" }), []);

  // Compute canvas mode based on selection
  const canvasMode = useMemo(() => {
    return state.componentId ? "component" : "page";
  }, [state.componentId]);

  return {
    state,
    canvasMode,
    selectPage,
    selectComponent,
    setNodeSelection,
    selectEdge,
    clearAll,
  } as const;
}
