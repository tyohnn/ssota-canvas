"use client";

import { useCallback, useMemo, useReducer } from "react";

export type ActiveLeftTab = "pages" | "layers" | "assets";

export type UiLayoutState = {
  activeLeftTab: ActiveLeftTab;
  showPageBlockInsertPanel: boolean;
  showBlockInsertPanel: boolean;
  showEditorPanel: boolean;
  selectedBlockIdForEditor?: string;
};

export type UiLayoutAction =
  | { type: "SET_ACTIVE_LEFT_TAB"; payload: { tab: ActiveLeftTab } }
  | { type: "OPEN_PAGE_BLOCK_INSERT" }
  | { type: "CLOSE_PAGE_BLOCK_INSERT" }
  | { type: "OPEN_BLOCK_INSERT" }
  | { type: "CLOSE_BLOCK_INSERT" }
  | { type: "OPEN_EDITOR"; payload?: { blockId?: string } }
  | { type: "CLOSE_EDITOR" }
  | { type: "CLOSE_ALL_PANELS" };

const initialState: UiLayoutState = {
  activeLeftTab: "pages",
  showPageBlockInsertPanel: false,
  showBlockInsertPanel: false,
  showEditorPanel: false,
  selectedBlockIdForEditor: undefined,
};

function reducer(state: UiLayoutState, action: UiLayoutAction): UiLayoutState {
  switch (action.type) {
    case "SET_ACTIVE_LEFT_TAB":
      return { ...state, activeLeftTab: action.payload.tab };

    case "OPEN_PAGE_BLOCK_INSERT":
      return {
        ...state,
        showEditorPanel: false,
        showBlockInsertPanel: false,
        showPageBlockInsertPanel: true,
      };

    case "CLOSE_PAGE_BLOCK_INSERT":
      return { ...state, showPageBlockInsertPanel: false };

    case "OPEN_BLOCK_INSERT":
      return {
        ...state,
        showEditorPanel: false,
        showPageBlockInsertPanel: false,
        showBlockInsertPanel: true,
      };

    case "CLOSE_BLOCK_INSERT":
      return { ...state, showBlockInsertPanel: false };

    case "OPEN_EDITOR":
      return {
        ...state,
        showPageBlockInsertPanel: false,
        showBlockInsertPanel: false,
        showEditorPanel: true,
        selectedBlockIdForEditor: action.payload?.blockId,
      };

    case "CLOSE_EDITOR":
      return {
        ...state,
        showEditorPanel: false,
        selectedBlockIdForEditor: undefined,
      };

    case "CLOSE_ALL_PANELS":
      return {
        ...state,
        showPageBlockInsertPanel: false,
        showBlockInsertPanel: false,
        showEditorPanel: false,
      };

    default:
      return state;
  }
}

export function useUiLayoutHandler(initial?: Partial<UiLayoutState>) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    ...(initial ?? {}),
  });

  // Action wrappers
  const setActiveLeftTab = useCallback((tab: ActiveLeftTab) => {
    dispatch({ type: "SET_ACTIVE_LEFT_TAB", payload: { tab } });
  }, []);

  const openPageBlockInsertPanel = useCallback(() => {
    dispatch({ type: "OPEN_PAGE_BLOCK_INSERT" });
  }, []);

  const closePageBlockInsertPanel = useCallback(() => {
    dispatch({ type: "CLOSE_PAGE_BLOCK_INSERT" });
  }, []);

  const openBlockInsertPanel = useCallback(() => {
    dispatch({ type: "OPEN_BLOCK_INSERT" });
  }, []);

  const closeBlockInsertPanel = useCallback(() => {
    dispatch({ type: "CLOSE_BLOCK_INSERT" });
  }, []);

  const openEditorPanel = useCallback((blockId?: string) => {
    dispatch({ type: "OPEN_EDITOR", payload: { blockId } });
  }, []);

  const closeEditorPanel = useCallback(() => {
    dispatch({ type: "CLOSE_EDITOR" });
  }, []);

  const closeAllPanels = useCallback(() => {
    dispatch({ type: "CLOSE_ALL_PANELS" });
  }, []);

  const toggleBlockInsertPanel = useCallback(() => {
    if (state.showBlockInsertPanel) {
      dispatch({ type: "CLOSE_BLOCK_INSERT" });
    } else {
      dispatch({ type: "OPEN_BLOCK_INSERT" });
    }
  }, [state.showBlockInsertPanel]);

  return useMemo(
    () => ({
      state,
      dispatch,
      // state fields
      activeLeftTab: state.activeLeftTab,
      showPageBlockInsertPanel: state.showPageBlockInsertPanel,
      showBlockInsertPanel: state.showBlockInsertPanel,
      showEditorPanel: state.showEditorPanel,
      selectedBlockIdForEditor: state.selectedBlockIdForEditor,
      // actions
      setActiveLeftTab,
      openPageBlockInsertPanel,
      closePageBlockInsertPanel,
      openBlockInsertPanel,
      closeBlockInsertPanel,
      toggleBlockInsertPanel,
      openEditorPanel,
      closeEditorPanel,
      closeAllPanels,
    }),
    [
      state,
      setActiveLeftTab,
      openPageBlockInsertPanel,
      closePageBlockInsertPanel,
      openBlockInsertPanel,
      closeBlockInsertPanel,
      toggleBlockInsertPanel,
      openEditorPanel,
      closeEditorPanel,
      closeAllPanels,
    ]
  );
}
