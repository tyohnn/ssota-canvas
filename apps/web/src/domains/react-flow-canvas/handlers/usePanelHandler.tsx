"use client";

import { useCallback, useMemo, useReducer } from "react";

export type ActiveExplorerTab = "pages" | "layers" | "assets";

export type PanelState = {
  // explorer
  activeExplorerTab: ActiveExplorerTab;
  // block insert
  showBlockInsertPanel: boolean;
  // editor
  showEditorPanel: boolean;
};

export type PanelAction =
  // explorer
  | { type: "SET_ACTIVE_EXPLORER_TAB"; payload: { tab: ActiveExplorerTab } }
  // block insert
  | { type: "OPEN_BLOCK_INSERT" }
  | { type: "CLOSE_BLOCK_INSERT" }
  // editor
  | { type: "OPEN_EDITOR" }
  | { type: "CLOSE_EDITOR" }
  // all
  | { type: "CLOSE_ALL_PANELS" };

const initialState: PanelState = {
  activeExplorerTab: "pages",
  showBlockInsertPanel: false,
  showEditorPanel: false,
};

function reducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case "SET_ACTIVE_EXPLORER_TAB":
      return { ...state, activeExplorerTab: action.payload.tab };

    case "OPEN_BLOCK_INSERT":
      return {
        ...state,
        showEditorPanel: false,
        showBlockInsertPanel: true,
      };

    case "CLOSE_BLOCK_INSERT":
      return { ...state, showBlockInsertPanel: false };

    case "OPEN_EDITOR":
      return {
        ...state,
        showBlockInsertPanel: false,
        showEditorPanel: true,
      };

    case "CLOSE_EDITOR":
      return {
        ...state,
        showEditorPanel: false
      };

    case "CLOSE_ALL_PANELS":
      return {
        ...state,
        showBlockInsertPanel: false,
        showEditorPanel: false,
      };

    default:
      return state;
  }
}

export function usePanelHandler(initial?: Partial<PanelState>) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    ...(initial ?? {}),
  });

  // Action wrappers
  const setActiveExplorerTab = useCallback((tab: ActiveExplorerTab) => {
    dispatch({ type: "SET_ACTIVE_EXPLORER_TAB", payload: { tab } });
  }, []);

  const openBlockInsertPanel = useCallback(() => {
    dispatch({ type: "OPEN_BLOCK_INSERT" });
  }, []);

  const closeBlockInsertPanel = useCallback(() => {
    dispatch({ type: "CLOSE_BLOCK_INSERT" });
  }, []);

  const openEditorPanel = useCallback(() => {
    dispatch({ type: "OPEN_EDITOR" });
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
      activeExplorerTab: state.activeExplorerTab,
      showBlockInsertPanel: state.showBlockInsertPanel,
      showEditorPanel: state.showEditorPanel,
      // actions
      setActiveExplorerTab,
      openBlockInsertPanel,
      closeBlockInsertPanel,
      toggleBlockInsertPanel,
      openEditorPanel,
      closeEditorPanel,
      closeAllPanels,
    }),
    [
      state,
      setActiveExplorerTab,
      openBlockInsertPanel,
      closeBlockInsertPanel,
      toggleBlockInsertPanel,
      openEditorPanel,
      closeEditorPanel,
      closeAllPanels,
    ]
  );
}
