"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { Edge } from "@/db/schema";

export type EdgeId = string;
export type EdgeMap = Record<EdgeId, Edge>;

export type EdgesState = {
  byId: EdgeMap;
  allIds: EdgeId[];
  selectedId: EdgeId | null;
  lastUpdatedAt: number | null;
  byContext: Record<string, { edges: Edge[]; lastAccessed: Date }>;
};

type Action =
  | { type: "INIT"; payload: { edges: Edge[] } }
  | { type: "UPSERT"; payload: { edge: Edge } }
  | { type: "UPSERT_MANY"; payload: { edges: Edge[] } }
  | { type: "REMOVE"; payload: { id: EdgeId } }
  | { type: "SELECT"; payload: { id: EdgeId | null } }
  | { type: "SET_CONTEXT_EDGES"; payload: { pageId: string; edges: Edge[] } }
  | { type: "CLEAR_CONTEXT_EDGES"; payload: { pageId: string } }
  | { type: "ACCESS_CONTEXT_EDGES"; payload: { pageId: string } };

const initialState: EdgesState = {
  byId: {},
  allIds: [],
  selectedId: null,
  lastUpdatedAt: null,
  byContext: {},
};

function upsert(map: EdgeMap, edge: Edge): EdgeMap {
  if (!edge?.id) return map;
  if (map[edge.id]) return { ...map, [edge.id]: { ...map[edge.id], ...edge } };
  return { ...map, [edge.id]: edge };
}

function reducer(state: EdgesState, action: Action): EdgesState {
  switch (action.type) {
    case "INIT": {
      const byId: EdgeMap = {};
      const allIds: string[] = [];
      for (const e of action.payload.edges) {
        byId[e.id as string] = e;
        allIds.push(e.id as string);
      }
      return { ...state, byId, allIds, lastUpdatedAt: Date.now() };
    }
    case "UPSERT": {
      const byId = upsert(state.byId, action.payload.edge);
      const id = action.payload.edge.id as string;
      const allIds = state.allIds.includes(id)
        ? state.allIds
        : [...state.allIds, id];
      return { ...state, byId, allIds, lastUpdatedAt: Date.now() };
    }
    case "UPSERT_MANY": {
      let byId = state.byId;
      const ids = new Set(state.allIds);
      for (const e of action.payload.edges) {
        byId = upsert(byId, e);
        ids.add(e.id as string);
      }
      return {
        ...state,
        byId,
        allIds: Array.from(ids),
        lastUpdatedAt: Date.now(),
      };
    }
    case "REMOVE": {
      if (!state.byId[action.payload.id]) return state;
      const { [action.payload.id]: _drop, ...byId } = state.byId;
      const allIds = state.allIds.filter((x) => x !== action.payload.id);
      const selectedId =
        state.selectedId === action.payload.id ? null : state.selectedId;
      return { ...state, byId, allIds, selectedId, lastUpdatedAt: Date.now() };
    }
    case "SELECT": {
      const id = action.payload.id;
      const safe = id && state.byId[id] ? id : null;
      return { ...state, selectedId: safe };
    }
    case "SET_CONTEXT_EDGES": {
      const { pageId, edges } = action.payload;
      return {
        ...state,
        byContext: {
          ...state.byContext,
          [pageId]: { edges, lastAccessed: new Date() },
        },
      };
    }
    case "CLEAR_CONTEXT_EDGES": {
      const { pageId } = action.payload;
      const { [pageId]: _c, ...rest } = state.byContext;
      return { ...state, byContext: rest };
    }
    case "ACCESS_CONTEXT_EDGES": {
      const { pageId } = action.payload;
      const ctx = state.byContext[pageId];
      if (!ctx) return state;
      return {
        ...state,
        byContext: {
          ...state.byContext,
          [pageId]: { ...ctx, lastAccessed: new Date() },
        },
      };
    }
    default:
      return state;
  }
}

export function useEdgesStore(initial?: Edge[]) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const mounted = useRef(false);

  const init = useCallback(
    (edges: Edge[]) => dispatch({ type: "INIT", payload: { edges } }),
    []
  );
  const upsertEdge = useCallback(
    (edge: Edge) => dispatch({ type: "UPSERT", payload: { edge } }),
    []
  );
  const upsertEdges = useCallback(
    (edges: Edge[]) => dispatch({ type: "UPSERT_MANY", payload: { edges } }),
    []
  );
  const removeEdge = useCallback(
    (id: string) => dispatch({ type: "REMOVE", payload: { id } }),
    []
  );
  const selectEdge = useCallback(
    (id: string | null) => dispatch({ type: "SELECT", payload: { id } }),
    []
  );
  const setContextEdges = useCallback(
    (pageId: string, edges: Edge[]) =>
      dispatch({ type: "SET_CONTEXT_EDGES", payload: { pageId, edges } }),
    []
  );
  const clearContextEdges = useCallback(
    (pageId: string) =>
      dispatch({ type: "CLEAR_CONTEXT_EDGES", payload: { pageId } }),
    []
  );
  const accessContextEdges = useCallback(
    (pageId: string) =>
      dispatch({ type: "ACCESS_CONTEXT_EDGES", payload: { pageId } }),
    []
  );

  const edges = useMemo(
    () => state.allIds.map((id) => state.byId[id]).filter(Boolean) as Edge[],
    [state]
  );

  const getEdgesForContext = useCallback(
    (pageId: string | null | undefined) => {
      if (!pageId) return [] as Edge[];
      return state.byContext[pageId]?.edges || [];
    },
    [state.byContext]
  );

  // eager init outside of render cycle
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (initial && initial.length) {
      init(initial);
    }
  }, [initial, init]);

  return {
    state,
    edges,
    init,
    upsertEdge,
    upsertEdges,
    removeEdge,
    selectEdge,
    setContextEdges,
    clearContextEdges,
    accessContextEdges,
    getEdgesForContext,
  } as const;
}
