"use client";

import { useCallback, useMemo, useReducer } from "react";
import type { ComponentDefinition } from "@/domains/block-components/types/component.types";

export type ComponentBlockState = {
  componentBlocks: ComponentDefinition[];
  lastUpdatedAt: number | null;
};

type Action =
  | { type: "SET"; payload: { componentBlocks: ComponentDefinition[] } }
  | { type: "ADD"; payload: { componentBlock: ComponentDefinition } }
  | { type: "REMOVE"; payload: { id: string } }
  | { type: "UPDATE"; payload: { id: string; updates: Partial<ComponentDefinition> } }
  | { type: "REPLACE_ID"; payload: { fromId: string; toId: string; updates?: Partial<ComponentDefinition> } };

const initialState: ComponentBlockState = {
  componentBlocks: [],
  lastUpdatedAt: null,
};

function reducer(state: ComponentBlockState, action: Action): ComponentBlockState {
  switch (action.type) {
    case "SET": {
      return { 
        componentBlocks: action.payload.componentBlocks, 
        lastUpdatedAt: Date.now() 
      };
    }
    case "ADD": {
      const existingIndex = state.componentBlocks.findIndex(b => b.id === action.payload.componentBlock.id);
      if (existingIndex >= 0) {
        const newComponentBlocks = [...state.componentBlocks];
        newComponentBlocks[existingIndex] = { ...newComponentBlocks[existingIndex], ...action.payload.componentBlock };
        return { componentBlocks: newComponentBlocks, lastUpdatedAt: Date.now() };
      }
      return { 
        componentBlocks: [...state.componentBlocks, action.payload.componentBlock], 
        lastUpdatedAt: Date.now() 
      };
    }
    case "REMOVE": {
      return { 
        componentBlocks: state.componentBlocks.filter(b => b.id !== action.payload.id), 
        lastUpdatedAt: Date.now() 
      };
    }
    case "UPDATE": {
      return {
        componentBlocks: state.componentBlocks.map((b: ComponentDefinition) => 
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
        componentBlocks: state.componentBlocks.map((b: ComponentDefinition) => 
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

export function useComponentBlockStore(initial?: ComponentDefinition[]) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setComponentBlocks = useCallback(
    (componentBlocks: ComponentDefinition[]) => dispatch({ type: "SET", payload: { componentBlocks } }),
    []
  );
  
  const addComponentBlock = useCallback(
    (componentBlock: ComponentDefinition) => dispatch({ type: "ADD", payload: { componentBlock } }),
    []
  );
  
  const removeComponentBlock = useCallback(
    (id: string) => dispatch({ type: "REMOVE", payload: { id } }),
    []
  );
  
  const updateComponentBlock = useCallback(
    (id: string, updates: Partial<ComponentDefinition>) =>
      dispatch({ type: "UPDATE", payload: { id, updates } }),
    []
  );

  const replaceComponentBlockId = useCallback(
    (fromId: string, toId: string, updates?: Partial<ComponentDefinition>) =>
      dispatch({ type: "REPLACE_ID", payload: { fromId, toId, updates } }),
    []
  );

  const getComponentBlockById = useCallback(
    (id: string) => state.componentBlocks.find(b => b.id === id),
    [state.componentBlocks]
  );

  // Initialize with initial component blocks if provided
  useMemo(() => {
    if (initial && initial.length > 0) {
      setComponentBlocks(initial);
    }
  }, []);

  return {
    componentBlocks: state.componentBlocks,
    lastUpdatedAt: state.lastUpdatedAt,
    getComponentBlockById,
    setComponentBlocks,
    addComponentBlock,
    removeComponentBlock,
    updateComponentBlock,
    replaceComponentBlockId,
  } as const;
}
