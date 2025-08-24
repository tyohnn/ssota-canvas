"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { Block } from "@/db/schema";

export type BlockId = string;
export type BlockMap = Record<BlockId, Block>;

export type BlocksState = {
  byId: BlockMap;
  allIds: BlockId[];
  lastUpdatedAt: number | null;
};

type Action =
  | { type: "INIT"; payload: { blocks: Block[] } }
  | { type: "UPSERT"; payload: { block: Block } }
  | { type: "UPSERT_MANY"; payload: { blocks: Block[] } }
  | { type: "REMOVE"; payload: { id: BlockId } }
  | { type: "UPDATE"; payload: { id: BlockId; updates: Partial<Block> } }
  | {
      type: "REKEY";
      payload: { fromId: string; toId: string; updates?: Partial<Block> };
    };

const initialState: BlocksState = {
  byId: {},
  allIds: [],
  lastUpdatedAt: null,
};

function upsert(map: BlockMap, block: Block): BlockMap {
  if (!block?.id) return map;
  if (map[block.id])
    return { ...map, [block.id]: { ...map[block.id], ...block } };
  return { ...map, [block.id]: block };
}

function reducer(state: BlocksState, action: Action): BlocksState {
  switch (action.type) {
    case "INIT": {
      const byId: BlockMap = {};
      const allIds: string[] = [];
      for (const b of action.payload.blocks) {
        byId[b.id as string] = b;
        allIds.push(b.id as string);
      }
      return { byId, allIds, lastUpdatedAt: Date.now() };
    }
    case "UPSERT": {
      const byId = upsert(state.byId, action.payload.block);
      const id = action.payload.block.id as string;
      const allIds = state.allIds.includes(id)
        ? state.allIds
        : [...state.allIds, id];
      return { byId, allIds, lastUpdatedAt: Date.now() };
    }
    case "UPSERT_MANY": {
      let byId = state.byId;
      const ids = new Set(state.allIds);
      for (const b of action.payload.blocks) {
        byId = upsert(byId, b);
        ids.add(b.id as string);
      }
      return { byId, allIds: Array.from(ids), lastUpdatedAt: Date.now() };
    }
    case "REMOVE": {
      if (!state.byId[action.payload.id]) return state;
      const { [action.payload.id]: _drop, ...byId } = state.byId;
      const allIds = state.allIds.filter((x) => x !== action.payload.id);
      return { byId, allIds, lastUpdatedAt: Date.now() };
    }
    case "UPDATE": {
      const id = action.payload.id;
      if (!state.byId[id]) return state;
      const byId = {
        ...state.byId,
        [id]: { ...state.byId[id], ...action.payload.updates },
      } as BlockMap;
      return { ...state, byId, lastUpdatedAt: Date.now() };
    }
    case "REKEY": {
      const { fromId, toId, updates } = action.payload;
      const existing = state.byId[fromId];
      if (!existing) return state;

      const newBlock = { ...existing, ...(updates || {}), id: toId } as Block;
      const { [fromId]: _, ...rest } = state.byId;
      const byId = { ...rest, [toId]: newBlock };
      const allIds = state.allIds.map((x) => (x === fromId ? toId : x));
      return { byId, allIds, lastUpdatedAt: Date.now() };
    }
    default:
      return state;
  }
}

export function useBlocksStore(initial?: Block[]) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const mounted = useRef(false);

  const init = useCallback(
    (blocks: Block[]) => dispatch({ type: "INIT", payload: { blocks } }),
    []
  );
  const upsertBlock = useCallback(
    (block: Block) => dispatch({ type: "UPSERT", payload: { block } }),
    []
  );
  const upsertBlocks = useCallback(
    (blocks: Block[]) => dispatch({ type: "UPSERT_MANY", payload: { blocks } }),
    []
  );
  const removeBlock = useCallback(
    (id: string) => dispatch({ type: "REMOVE", payload: { id } }),
    []
  );
  const updateBlock = useCallback(
    (id: string, updates: Partial<Block>) =>
      dispatch({ type: "UPDATE", payload: { id, updates } }),
    []
  );

  const rekeyBlock = useCallback(
    (fromId: string, toId: string, updates?: Partial<Block>) =>
      dispatch({ type: "REKEY", payload: { fromId, toId, updates } }),
    []
  );

  const blocks = useMemo(
    () => state.allIds.map((id) => state.byId[id]),
    [state]
  );
  const getBlockById = useCallback(
    (id: string) => state.byId[id],
    [state.byId]
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
    blocks,
    getBlockById,
    init,
    upsertBlock,
    upsertBlocks,
    removeBlock,
    updateBlock,
    rekeyBlock,
  } as const;
}
