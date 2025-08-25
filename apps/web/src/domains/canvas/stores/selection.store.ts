"use client";

import { useCallback, useReducer, useMemo } from "react";

export type SelectionState = {
  pageId: string | null;
  componentId: string | null;
  nodeIds: string[]; // XYFlow nodes selected
  edgeId: string | null;
  // 드래그 선택 관련 상태
  dragSelection: {
    isDragging: boolean;
    selectionBox: { 
      start: { x: number; y: number }; 
      current: { x: number; y: number } 
    } | null;
    isCtrlPressed: boolean;
    tempSelectedIds: string[]; // 드래그 중 임시 선택된 ID들
  };
};

type Action =
  | { type: "SELECT_PAGE"; payload: { id: string | null } }
  | { type: "SELECT_COMPONENT"; payload: { id: string | null } }
  | { type: "SET_NODE_SELECTION"; payload: { ids: string[] } }
  | { type: "SELECT_EDGE"; payload: { id: string | null } }
  | { type: "CLEAR_ALL" }
  | { type: "START_DRAG_SELECTION"; payload: { startPos: { x: number; y: number } } }
  | { type: "UPDATE_DRAG_SELECTION"; payload: { currentPos: { x: number; y: number } } }
  | { type: "END_DRAG_SELECTION" }
  | { type: "SET_CTRL_PRESSED"; payload: { pressed: boolean } }
  | { type: "SET_TEMP_SELECTED_IDS"; payload: { ids: string[] } };

const initial: SelectionState = {
  pageId: null,
  componentId: null,
  nodeIds: [],
  edgeId: null,
  dragSelection: {
    isDragging: false,
    selectionBox: null,
    isCtrlPressed: false,
    tempSelectedIds: [],
  },
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
    case "START_DRAG_SELECTION":
      return {
        ...state,
        dragSelection: {
          ...state.dragSelection,
          isDragging: true,
          selectionBox: {
            start: action.payload.startPos,
            current: action.payload.startPos,
          },
        },
      };
    case "UPDATE_DRAG_SELECTION":
      return {
        ...state,
        dragSelection: {
          ...state.dragSelection,
          selectionBox: state.dragSelection.selectionBox
            ? {
                ...state.dragSelection.selectionBox,
                current: action.payload.currentPos,
              }
            : null,
        },
      };
    case "END_DRAG_SELECTION":
      return {
        ...state,
        dragSelection: {
          ...state.dragSelection,
          isDragging: false,
          selectionBox: null,
          tempSelectedIds: [],
        },
      };
    case "SET_CTRL_PRESSED":
      return {
        ...state,
        dragSelection: {
          ...state.dragSelection,
          isCtrlPressed: action.payload.pressed,
        },
      };
    case "SET_TEMP_SELECTED_IDS":
      return {
        ...state,
        dragSelection: {
          ...state.dragSelection,
          tempSelectedIds: action.payload.ids,
        },
      };
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

  // 드래그 선택 관련 메서드들
  const startDragSelection = useCallback(
    (startPos: { x: number; y: number }) =>
      dispatch({ type: "START_DRAG_SELECTION", payload: { startPos } }),
    []
  );
  const updateDragSelection = useCallback(
    (currentPos: { x: number; y: number }) =>
      dispatch({ type: "UPDATE_DRAG_SELECTION", payload: { currentPos } }),
    []
  );
  const endDragSelection = useCallback(
    () => dispatch({ type: "END_DRAG_SELECTION" }),
    []
  );
  const setCtrlPressed = useCallback(
    (pressed: boolean) =>
      dispatch({ type: "SET_CTRL_PRESSED", payload: { pressed } }),
    []
  );
  const setTempSelectedIds = useCallback(
    (ids: string[]) =>
      dispatch({ type: "SET_TEMP_SELECTED_IDS", payload: { ids } }),
    []
  );

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
    startDragSelection,
    updateDragSelection,
    endDragSelection,
    setCtrlPressed,
    setTempSelectedIds,
  } as const;
}
