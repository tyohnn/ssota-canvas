"use client";

import { useReducer, useCallback } from "react";
import { Edge as DbEdge, BlockPosition as DbBlockPosition } from "@/db/schema";
import { DbBlock } from "@/domains/workflow-canvas/policy/block-definition-policy";

/**
 * 🎯 CANVAS STATE HOOK (Pure State Management)
 * ============================================
 *
 * 📋 역할: DB 데이터의 순수한 상태 관리 (Reducer 패턴)
 * - 모든 DB 블록, 엣지, 위치 데이터의 중앙 상태 관리
 * - 서버 액션과 분리된 순수한 상태 변경만 담당
 * - 예측 가능한 상태 변경을 위한 reducer 패턴 사용
 *
 * 🔧 주요 원칙:
 * - 순수 함수: 사이드 이펙트 없음
 * - 예측 가능성: reducer를 통한 상태 변경
 * - 관심사 분리: 서버 액션은 useCanvasEventHandler가 담당
 */

// Canvas State Interface
export interface CanvasState {
  // 원본 DB 데이터 (Single Source of Truth)
  dbBlocks: DbBlock[]; // 각 page block은 고유함
  dbEdges: DbEdge[];
  dbBlockPositions: DbBlockPosition[]; // context_block_id = page block ID

  selectedPageBlock: DbBlock | null;

  // 상태 관리
  loading: boolean;
  error: string | null;
}

// Canvas Actions
export type CanvasAction =
  // Loading & Error Management
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" }

  // Data Initialization
  | {
      type: "INITIALIZE_DATA";
      payload: {
        blocks: DbBlock[];
        edges: DbEdge[];
        positions: DbBlockPosition[];
      };
    }

  // Block Management
  | { type: "SET_BLOCKS"; payload: DbBlock[] }
  | { type: "ADD_BLOCK"; payload: DbBlock }
  | { type: "UPDATE_BLOCK"; payload: { id: string; updates: Partial<DbBlock> } }
  | { type: "DELETE_BLOCK"; payload: string }

  // Edge Management
  | { type: "SET_EDGES"; payload: DbEdge[] }
  | { type: "ADD_EDGE"; payload: DbEdge }
  | { type: "ADD_EDGES"; payload: DbEdge[] }
  | { type: "UPDATE_EDGE"; payload: { id: string; updates: Partial<DbEdge> } }
  | { type: "DELETE_EDGE"; payload: string }

  // Position Management
  | { type: "SET_POSITIONS"; payload: DbBlockPosition[] }
  | { type: "ADD_POSITION"; payload: DbBlockPosition }
  | {
      type: "UPDATE_POSITION";
      payload: {
        blockId: string;
        contextId: string;
        position: { x: number; y: number };
      };
    }
  | {
      type: "BATCH_UPDATE_POSITIONS";
      payload: Array<{
        blockId: string;
        contextId: string;
        position: { x: number; y: number };
      }>;
    }
  | { type: "DELETE_POSITIONS"; payload: string } // blockId

  // Selected Page Block Management
  | { type: "SET_SELECTED_PAGE_BLOCK"; payload: DbBlock | null }

  // Reset
  | { type: "RESET" };

// Initial State
const initialState: CanvasState = {
  dbBlocks: [],
  dbEdges: [],
  dbBlockPositions: [],
  selectedPageBlock: null,
  loading: false,
  error: null,
};

// Canvas Reducer
function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    // Loading & Error Management
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    // Data Initialization
    case "INITIALIZE_DATA":
      return {
        ...state,
        dbBlocks: action.payload.blocks,
        dbEdges: action.payload.edges,
        dbBlockPositions: action.payload.positions,
        loading: false,
        error: null,
      };

    // Block Management
    case "SET_BLOCKS":
      return { ...state, dbBlocks: action.payload };

    case "ADD_BLOCK":
      return {
        ...state,
        dbBlocks: [...state.dbBlocks, action.payload],
      };

    case "UPDATE_BLOCK":
      const updatedBlocks = state.dbBlocks.map((block) =>
        block.id === action.payload.id
          ? { ...block, ...action.payload.updates, updated_at: new Date() }
          : block
      );

      return {
        ...state,
        dbBlocks: updatedBlocks,
        // selectedPageBlock도 함께 업데이트
        selectedPageBlock:
          state.selectedPageBlock?.id === action.payload.id
            ? updatedBlocks.find((block) => block.id === action.payload.id) ||
              state.selectedPageBlock
            : state.selectedPageBlock,
      };

    case "DELETE_BLOCK":
      return {
        ...state,
        dbBlocks: state.dbBlocks.filter((block) => block.id !== action.payload),
        // 관련 엣지들도 제거
        dbEdges: state.dbEdges.filter(
          (edge) =>
            edge.source_block_id !== action.payload &&
            edge.target_block_id !== action.payload
        ),
        // 관련 위치 데이터도 제거
        dbBlockPositions: state.dbBlockPositions.filter(
          (pos) =>
            pos.block_id !== action.payload &&
            pos.context_block_id !== action.payload
        ),
      };

    // Edge Management
    case "SET_EDGES":
      return { ...state, dbEdges: action.payload };

    case "ADD_EDGE":
      return {
        ...state,
        dbEdges: [...state.dbEdges, action.payload],
      };

    case "ADD_EDGES":
      return {
        ...state,
        dbEdges: [...state.dbEdges, ...action.payload],
      };

    case "UPDATE_EDGE":
      return {
        ...state,
        dbEdges: state.dbEdges.map((edge) =>
          edge.id === action.payload.id
            ? { ...edge, ...action.payload.updates, updated_at: new Date() }
            : edge
        ),
      };

    case "DELETE_EDGE":
      return {
        ...state,
        dbEdges: state.dbEdges.filter((edge) => edge.id !== action.payload),
      };

    // Position Management
    case "SET_POSITIONS":
      return { ...state, dbBlockPositions: action.payload };

    case "ADD_POSITION":
      return {
        ...state,
        dbBlockPositions: [...state.dbBlockPositions, action.payload],
      };

    case "UPDATE_POSITION":
      return {
        ...state,
        dbBlockPositions: state.dbBlockPositions.map((pos) =>
          pos.block_id === action.payload.blockId &&
          pos.context_block_id === action.payload.contextId
            ? {
                ...pos,
                x_position: Math.round(action.payload.position.x),
                y_position: Math.round(action.payload.position.y),
                updated_at: new Date(),
              }
            : pos
        ),
      };

    case "BATCH_UPDATE_POSITIONS":
      return {
        ...state,
        dbBlockPositions: state.dbBlockPositions.map((pos) => {
          const update = action.payload.find(
            (u) =>
              u.blockId === pos.block_id && u.contextId === pos.context_block_id
          );
          return update
            ? {
                ...pos,
                x_position: Math.round(update.position.x),
                y_position: Math.round(update.position.y),
                updated_at: new Date(),
              }
            : pos;
        }),
      };

    case "DELETE_POSITIONS":
      return {
        ...state,
        dbBlockPositions: state.dbBlockPositions.filter(
          (pos) =>
            pos.block_id !== action.payload &&
            pos.context_block_id !== action.payload
        ),
      };

    // Selected Page Block Management
    case "SET_SELECTED_PAGE_BLOCK":
      return { ...state, selectedPageBlock: action.payload };

    // Reset
    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// Hook Interface
export interface UseCanvasStateReturn {
  // State
  dbBlocks: DbBlock[];
  dbEdges: DbEdge[];
  dbBlockPositions: DbBlockPosition[];
  selectedPageBlock: DbBlock | null;

  // Dispatch Actions (Pure State Changes Only)
  dispatch: React.Dispatch<CanvasAction>;

  // Convenience Methods (State-only operations)
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  initializeData: (data: {
    blocks: DbBlock[];
    edges: DbEdge[];
    positions: DbBlockPosition[];
  }) => void;

  addBlock: (block: DbBlock) => void;
  updateBlock: (id: string, updates: Partial<DbBlock>) => void;
  deleteBlock: (id: string) => void;

  addEdge: (edge: DbEdge) => void;
  addEdges: (edges: DbEdge[]) => void;
  updateEdge: (id: string, updates: Partial<DbEdge>) => void;
  deleteEdge: (id: string) => void;

  updatePosition: (
    blockId: string,
    contextId: string,
    position: { x: number; y: number }
  ) => void;
  addPosition: (position: DbBlockPosition) => void;
  batchUpdatePositions: (
    updates: Array<{
      blockId: string;
      contextId: string;
      position: { x: number; y: number };
    }>
  ) => void;

  setSelectedPageBlock: (block: DbBlock | null) => void;

  reset: () => void;
}

/**
 * Canvas State Hook (Pure State Management)
 */
export function useCanvasState(
  initialDbBlocks?: DbBlock[],
  initialDbEdges?: DbEdge[],
  initialDbBlockPositions?: DbBlockPosition[]
): UseCanvasStateReturn {
  // Initialize state with provided data
  const [state, dispatch] = useReducer(canvasReducer, {
    ...initialState,
    dbBlocks: initialDbBlocks || [],
    dbEdges: initialDbEdges || [],
    dbBlockPositions: initialDbBlockPositions || [],
  });

  // Convenience Methods (Wrapped dispatch calls)
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const initializeData = useCallback(
    (data: {
      blocks: DbBlock[];
      edges: DbEdge[];
      positions: DbBlockPosition[];
    }) => {
      dispatch({ type: "INITIALIZE_DATA", payload: data });
    },
    []
  );

  // Block operations
  const addBlock = useCallback((block: DbBlock) => {
    dispatch({ type: "ADD_BLOCK", payload: block });
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<DbBlock>) => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id, updates } });
  }, []);

  const deleteBlock = useCallback((id: string) => {
    dispatch({ type: "DELETE_BLOCK", payload: id });
  }, []);

  // Edge operations
  const addEdge = useCallback((edge: DbEdge) => {
    dispatch({ type: "ADD_EDGE", payload: edge });
  }, []);

  const addEdges = useCallback((edges: DbEdge[]) => {
    dispatch({ type: "ADD_EDGES", payload: edges });
  }, []);

  const updateEdge = useCallback((id: string, updates: Partial<DbEdge>) => {
    dispatch({ type: "UPDATE_EDGE", payload: { id, updates } });
  }, []);

  const deleteEdge = useCallback((id: string) => {
    dispatch({ type: "DELETE_EDGE", payload: id });
  }, []);

  // Position operations
  const updatePosition = useCallback(
    (
      blockId: string,
      contextId: string,
      position: { x: number; y: number }
    ) => {
      dispatch({
        type: "UPDATE_POSITION",
        payload: { blockId, contextId, position },
      });
    },
    []
  );

  const addPosition = useCallback((position: DbBlockPosition) => {
    dispatch({ type: "ADD_POSITION", payload: position });
  }, []);

  const batchUpdatePositions = useCallback(
    (
      updates: Array<{
        blockId: string;
        contextId: string;
        position: { x: number; y: number };
      }>
    ) => {
      dispatch({ type: "BATCH_UPDATE_POSITIONS", payload: updates });
    },
    []
  );

  // Selected Page Block Management
  const setSelectedPageBlock = useCallback((block: DbBlock | null) => {
    dispatch({ type: "SET_SELECTED_PAGE_BLOCK", payload: block });
  }, []);

  // Reset
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    dbBlocks: state.dbBlocks,
    dbEdges: state.dbEdges,
    dbBlockPositions: state.dbBlockPositions,
    selectedPageBlock: state.selectedPageBlock,

    dispatch,

    // Convenience methods
    setLoading,
    setError,
    clearError,

    initializeData,

    addBlock,
    updateBlock,
    deleteBlock,

    addEdge,
    addEdges,
    updateEdge,
    deleteEdge,

    updatePosition,
    addPosition,
    batchUpdatePositions,

    setSelectedPageBlock,
    reset,
  };
}
