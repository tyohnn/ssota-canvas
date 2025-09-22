"use client";

import { useCallback, useMemo, useReducer } from "react";
import type { Block } from "@/db/schema";

export type PageBlockState = {
  pageBlocks: Block[];
  lastUpdatedAt: number | null;
};

type Action =
  | { type: "SET"; payload: { pageBlocks: Block[] } }
  | { type: "ADD"; payload: { pageBlock: Block } }
  | { type: "REMOVE"; payload: { id: string } }
  | { type: "UPDATE"; payload: { id: string; updates: Partial<Block> } }
  | { type: "REPLACE_ID"; payload: { fromId: string; toId: string; updates?: Partial<Block> } };

const initialState: PageBlockState = {
  pageBlocks: [],
  lastUpdatedAt: null,
};

function reducer(state: PageBlockState, action: Action): PageBlockState {
  switch (action.type) {
    case "SET": {
      return { 
        pageBlocks: action.payload.pageBlocks, 
        lastUpdatedAt: Date.now() 
      };
    }
    case "ADD": {
      const existingIndex = state.pageBlocks.findIndex(b => b.id === action.payload.pageBlock.id);
      if (existingIndex >= 0) {
        const newPageBlocks = [...state.pageBlocks];
        newPageBlocks[existingIndex] = { ...newPageBlocks[existingIndex], ...action.payload.pageBlock };
        return { pageBlocks: newPageBlocks, lastUpdatedAt: Date.now() };
      }
      return { 
        pageBlocks: [...state.pageBlocks, action.payload.pageBlock], 
        lastUpdatedAt: Date.now() 
      };
    }
    case "REMOVE": {
      return { 
        pageBlocks: state.pageBlocks.filter(b => b.id !== action.payload.id), 
        lastUpdatedAt: Date.now() 
      };
    }
    case "UPDATE": {
      return {
        pageBlocks: state.pageBlocks.map(b => 
          b.id === action.payload.id 
            ? { ...b, ...action.payload.updates }
            : b
        ),
        lastUpdatedAt: Date.now()
      };
    }
    case "REPLACE_ID": {
      const { fromId, toId, updates } = action.payload;
      return {
        pageBlocks: state.pageBlocks.map(b => 
          b.id === fromId 
            ? { ...b, ...(updates || {}), id: toId }
            : b
        ),
        lastUpdatedAt: Date.now()
      };
    }
    default:
      return state;
  }
}

export function usePageBlockStore(initial?: Block[]) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setPageBlocks = useCallback(
    (pageBlocks: Block[]) => dispatch({ type: "SET", payload: { pageBlocks } }),
    []
  );
  
  const addPageBlock = useCallback(
    (pageBlock: Block) => dispatch({ type: "ADD", payload: { pageBlock } }),
    []
  );
  
  const removePageBlock = useCallback(
    (id: string) => dispatch({ type: "REMOVE", payload: { id } }),
    []
  );
  
  const updatePageBlock = useCallback(
    (id: string, updates: Partial<Block>) =>
      dispatch({ type: "UPDATE", payload: { id, updates } }),
    []
  );

  const replacePageBlockId = useCallback(
    (fromId: string, toId: string, updates?: Partial<Block>) =>
      dispatch({ type: "REPLACE_ID", payload: { fromId, toId, updates } }),
    []
  );

  const getPageBlockById = useCallback(
    (id: string) => state.pageBlocks.find(b => b.id === id),
    [state.pageBlocks]
  );

  // Initialize with initial page blocks if provided
  useMemo(() => {
    if (initial && initial.length > 0) {
      setPageBlocks(initial);
    }
  }, []);

  return {
    pageBlocks: state.pageBlocks,
    lastUpdatedAt: state.lastUpdatedAt,
    getPageBlockById,
    setPageBlocks,
    addPageBlock,
    removePageBlock,
    updatePageBlock,
    replacePageBlockId,
  } as const;
}
