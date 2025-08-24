"use client";

import { useCallback, useMemo, useReducer } from "react";
import type { BlockPosition } from "@/db/schema";

export type PagePositionCache = {
  [pageId: string]: {
    positions: BlockPosition[];
    lastAccessed: Date;
  };
};

export type PositionsState = {
  positionsByPage: PagePositionCache;
  pageAccessOrder: string[];
  maxCacheSize: number;
};

type Action =
  | {
      type: "SET_PAGE_POSITIONS";
      payload: { pageId: string; positions: BlockPosition[] };
    }
  | {
      type: "UPDATE_CONTEXT_POSITIONS";
      payload: {
        contextId: string;
        updates: { id: string; x: number; y: number }[];
      };
    }
  | {
      type: "REMOVE_FOR_BLOCK_IN_CONTEXT";
      payload: { contextId: string; blockId: string };
    }
  | { type: "CLEAR_PAGE_CACHE"; payload: { pageId: string } }
  | { type: "ACCESS_PAGE"; payload: { pageId: string } }
  | {
      type: "REPLACE_BLOCK_ID_IN_CONTEXT";
      payload: { contextId: string; fromId: string; toId: string };
    };

const initialState: PositionsState = {
  positionsByPage: {},
  pageAccessOrder: [],
  maxCacheSize: 5,
};

function reducer(state: PositionsState, action: Action): PositionsState {
  switch (action.type) {
    case "SET_PAGE_POSITIONS": {
      const { pageId, positions } = action.payload;
      const positionsByPage = { ...state.positionsByPage };
      const pageAccessOrder = [...state.pageAccessOrder];
      const idx = pageAccessOrder.indexOf(pageId);
      if (idx > -1) pageAccessOrder.splice(idx, 1);
      pageAccessOrder.unshift(pageId);
      if (pageAccessOrder.length > state.maxCacheSize) {
        const oldest = pageAccessOrder.pop()!;
        delete positionsByPage[oldest];
      }
      positionsByPage[pageId] = { positions, lastAccessed: new Date() };
      return { ...state, positionsByPage, pageAccessOrder };
    }
    case "UPDATE_CONTEXT_POSITIONS": {
      const { contextId, updates } = action.payload;
      const pageData = state.positionsByPage[contextId];
      if (!pageData || updates.length === 0) return state;
      const byKey = new Map<string, BlockPosition>();
      pageData.positions.forEach((p) =>
        byKey.set(`${p.block_id as string}|${p.context_block_id as string}`, p)
      );
      updates.forEach((u) => {
        const key = `${u.id}|${contextId}`;
        const existing = byKey.get(key);
        if (existing) {
          byKey.set(key, {
            ...existing,
            x_position: Math.round(u.x),
            y_position: Math.round(u.y),
          });
        } else {
          byKey.set(key, {
            id: (typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${u.id}-${contextId}`) as any,
            block_id: u.id as any,
            context_block_id: contextId as any,
            x_position: Math.round(u.x) as any,
            y_position: Math.round(u.y) as any,
            created_at: new Date() as any,
            updated_at: new Date() as any,
          } as BlockPosition);
        }
      });
      const positionsByPage = {
        ...state.positionsByPage,
        [contextId]: { ...pageData, positions: Array.from(byKey.values()) },
      };
      return { ...state, positionsByPage };
    }
    case "REMOVE_FOR_BLOCK_IN_CONTEXT": {
      const { contextId, blockId } = action.payload;
      const pageData = state.positionsByPage[contextId];
      if (!pageData) return state;
      const positionsByPage = {
        ...state.positionsByPage,
        [contextId]: {
          ...pageData,
          positions: pageData.positions.filter(
            (p) => (p.block_id as string) !== blockId
          ),
        },
      };
      return { ...state, positionsByPage };
    }
    case "CLEAR_PAGE_CACHE": {
      const { pageId } = action.payload;
      const positionsByPage = { ...state.positionsByPage };
      const pageAccessOrder = state.pageAccessOrder.filter(
        (id) => id !== pageId
      );
      delete positionsByPage[pageId];
      return { ...state, positionsByPage, pageAccessOrder };
    }
    case "ACCESS_PAGE": {
      const { pageId } = action.payload;
      const pageData = state.positionsByPage[pageId];
      if (!pageData) return state;
      const pageAccessOrder = [...state.pageAccessOrder];
      const idx = pageAccessOrder.indexOf(pageId);
      if (idx > -1) pageAccessOrder.splice(idx, 1);
      pageAccessOrder.unshift(pageId);
      const positionsByPage = {
        ...state.positionsByPage,
        [pageId]: { ...pageData, lastAccessed: new Date() },
      };
      return { ...state, positionsByPage, pageAccessOrder };
    }
    case "REPLACE_BLOCK_ID_IN_CONTEXT": {
      const { contextId, fromId, toId } = action.payload;
      const pageData = state.positionsByPage[contextId];
      if (!pageData) return state;
      const positionsByPage = {
        ...state.positionsByPage,
        [contextId]: {
          ...pageData,
          positions: pageData.positions.map((p) =>
            p.block_id === fromId ? { ...p, block_id: toId } : p
          ),
        },
      };
      return { ...state, positionsByPage };
    }
    default:
      return state;
  }
}

export function usePositionsStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setPagePositions = useCallback(
    (pageId: string, positions: BlockPosition[]) =>
      dispatch({ type: "SET_PAGE_POSITIONS", payload: { pageId, positions } }),
    []
  );
  const accessPage = useCallback(
    (pageId: string) => dispatch({ type: "ACCESS_PAGE", payload: { pageId } }),
    []
  );
  const clearPageCache = useCallback(
    (pageId: string) =>
      dispatch({ type: "CLEAR_PAGE_CACHE", payload: { pageId } }),
    []
  );
  const updateContextPositions = useCallback(
    (contextId: string, updates: { id: string; x: number; y: number }[]) =>
      dispatch({
        type: "UPDATE_CONTEXT_POSITIONS",
        payload: { contextId, updates },
      }),
    []
  );
  const removePositionForBlockInContext = useCallback(
    (contextId: string, blockId: string) =>
      dispatch({
        type: "REMOVE_FOR_BLOCK_IN_CONTEXT",
        payload: { contextId, blockId },
      }),
    []
  );
  const replaceBlockIdInContext = useCallback(
    (contextId: string, fromId: string, toId: string) =>
      dispatch({
        type: "REPLACE_BLOCK_ID_IN_CONTEXT",
        payload: { contextId, fromId, toId },
      }),
    []
  );

  const getPositionsForContext = useCallback(
    (contextId: string | null | undefined) => {
      if (!contextId) return [] as BlockPosition[];
      const pageData = state.positionsByPage[contextId];
      return pageData ? pageData.positions : [];
    },
    [state.positionsByPage]
  );

  const positions = useMemo(
    () => Object.values(state.positionsByPage).flatMap((x) => x.positions),
    [state.positionsByPage]
  );

  return {
    positionsByPage: state.positionsByPage,
    pageAccessOrder: state.pageAccessOrder,
    positions,
    setPagePositions,
    accessPage,
    clearPageCache,
    updateContextPositions,
    getPositionsForContext,
    removePositionForBlockInContext,
    replaceBlockIdInContext,
  } as const;
}
