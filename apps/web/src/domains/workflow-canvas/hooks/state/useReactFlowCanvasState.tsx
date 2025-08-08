"use client";

import { useReducer, useCallback } from "react";
import { Node as ReactFlowBlock, Edge as ReactFlowEdge } from "@xyflow/react";

/**
 * 🎯 REACT FLOW CANVAS STATE HOOK (단순화)
 * ========================================
 *
 * 📋 훅 역할:
 * - 현재 활성 페이지의 display blocks/edges만 관리
 * - React Flow 캔버스 인터랙션 상태 관리
 * - 선택 상태 관리
 *
 * 🔧 주요 기능:
 * - displayBlocks, displayEdges 관리
 * - 선택 상태 관리
 * - 캔버스 인터랙션 상태 관리
 *
 * 📦 반환값:
 * - displayBlocks, displayEdges 상태 및 조작 메서드
 * - 선택 상태 관리 메서드
 * - 캔버스 인터랙션 상태 관리 메서드
 */

// React Flow Canvas state types (단순화)
export interface ReactFlowCanvasState {
  // 현재 캔버스에 렌더링되는 블록/엣지 (페이지별 필터링된 데이터)
  displayBlocks: ReactFlowBlock[]; // 현재 캔버스에 표시되는 블록 배열
  displayEdges: ReactFlowEdge[]; // 현재 캔버스에 표시되는 엣지 배열

  // 선택 상태
  selectedBlocks: string[]; // 리액트 플로우 캔버스에서 선택된 블록 ID 배열
  selectedEdges: string[]; // 리액트 플로우 캔버스에서 선택된 엣지 ID 배열

  // 캔버스 인터랙션 상태
  isDragging: boolean;
  isConnecting: boolean;
  zoom: number;
  pan: { x: number; y: number };

  // 시스템 상태
  loading: boolean;
  error: string | null;
}

// Canvas actions (단순화)
export type ReactFlowCanvasAction =
  // Display Management (페이지별 필터링된 렌더링 데이터)
  | { type: "SET_DISPLAY_BLOCKS"; payload: ReactFlowBlock[] }
  | { type: "SET_DISPLAY_EDGES"; payload: ReactFlowEdge[] }
  | {
      type: "UPDATE_DISPLAY_BLOCK";
      payload: { id: string; data: Partial<ReactFlowBlock["data"]> };
    }
  | { type: "ADD_DISPLAY_BLOCK"; payload: ReactFlowBlock }
  | { type: "DELETE_DISPLAY_BLOCK"; payload: string }

  // Selection Management
  | { type: "SELECT_BLOCK"; payload: string }
  | { type: "DESELECT_BLOCK"; payload: string }
  | { type: "SELECT_EDGE"; payload: string }
  | { type: "DESELECT_EDGE"; payload: string }
  | { type: "CLEAR_SELECTION" }

  // Canvas Interaction Management
  | { type: "SET_DRAGGING"; payload: boolean }
  | { type: "SET_CONNECTING"; payload: boolean }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "SET_PAN"; payload: { x: number; y: number } }

  // System Management
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET_CANVAS" };

// Initial state (단순화)
const initialState: ReactFlowCanvasState = {
  // 현재 캔버스에 렌더링되는 블록/엣지
  displayBlocks: [],
  displayEdges: [],

  // 선택 상태
  selectedBlocks: [],
  selectedEdges: [],

  // 캔버스 인터랙션 상태
  isDragging: false,
  isConnecting: false,
  zoom: 1,
  pan: { x: 0, y: 0 },

  // 시스템 상태
  loading: false,
  error: null,
};

// Canvas reducer (단순화)
function reactFlowCanvasReducer(
  state: ReactFlowCanvasState,
  action: ReactFlowCanvasAction
): ReactFlowCanvasState {
  switch (action.type) {
    // Display Management Cases
    case "SET_DISPLAY_BLOCKS":
      return { ...state, displayBlocks: action.payload };

    case "SET_DISPLAY_EDGES":
      return { ...state, displayEdges: action.payload };

    case "UPDATE_DISPLAY_BLOCK":
      return {
        ...state,
        displayBlocks: state.displayBlocks.map((block) =>
          block.id === action.payload.id
            ? { ...block, data: { ...block.data, ...action.payload.data } }
            : block
        ),
      };

    case "ADD_DISPLAY_BLOCK":
      return {
        ...state,
        displayBlocks: [...state.displayBlocks, action.payload],
      };

    case "DELETE_DISPLAY_BLOCK":
      return {
        ...state,
        displayBlocks: state.displayBlocks.filter(
          (block) => block.id !== action.payload
        ),
        displayEdges: state.displayEdges.filter(
          (edge) =>
            edge.source !== action.payload && edge.target !== action.payload
        ),
      };

    // Selection Management Cases
    case "SELECT_BLOCK":
      return {
        ...state,
        selectedBlocks: [action.payload],
        selectedEdges: state.selectedEdges.filter(
          (id) => id !== action.payload
        ),
      };

    case "DESELECT_BLOCK":
      return {
        ...state,
        selectedBlocks: state.selectedBlocks.filter(
          (id) => id !== action.payload
        ),
      };

    case "SELECT_EDGE":
      return {
        ...state,
        selectedEdges: [...state.selectedEdges, action.payload],
        selectedBlocks: state.selectedBlocks.filter(
          (id) => id !== action.payload
        ),
      };

    case "DESELECT_EDGE":
      return {
        ...state,
        selectedEdges: state.selectedEdges.filter(
          (id) => id !== action.payload
        ),
      };

    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedBlocks: [],
        selectedEdges: [],
      };

    // Canvas Interaction Management Cases
    case "SET_DRAGGING":
      return { ...state, isDragging: action.payload };

    case "SET_CONNECTING":
      return { ...state, isConnecting: action.payload };

    case "SET_ZOOM":
      return { ...state, zoom: action.payload };

    case "SET_PAN":
      return { ...state, pan: action.payload };

    // System Management Cases
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "RESET_CANVAS":
      return initialState;

    default:
      return state;
  }
}

/**
 * Custom hook for managing React Flow canvas state (단순화)
 */
export function useReactFlowCanvasState() {
  const [state, dispatch] = useReducer(reactFlowCanvasReducer, initialState);

  // Display operations
  const setDisplayBlocks = useCallback((blocks: ReactFlowBlock[]) => {
    dispatch({ type: "SET_DISPLAY_BLOCKS", payload: blocks });
  }, []);

  const setDisplayEdges = useCallback((edges: ReactFlowEdge[]) => {
    dispatch({ type: "SET_DISPLAY_EDGES", payload: edges });
  }, []);

  const addDisplayBlock = useCallback((block: ReactFlowBlock) => {
    dispatch({ type: "ADD_DISPLAY_BLOCK", payload: block });
  }, []);

  const updateDisplayBlock = useCallback(
    (id: string, data: Partial<ReactFlowBlock["data"]>) => {
      dispatch({ type: "UPDATE_DISPLAY_BLOCK", payload: { id, data } });
    },
    []
  );

  const deleteDisplayBlock = useCallback((id: string) => {
    dispatch({ type: "DELETE_DISPLAY_BLOCK", payload: id });
  }, []);

  // Selection operations
  const selectBlock = useCallback((id: string) => {
    dispatch({ type: "SELECT_BLOCK", payload: id });
  }, []);

  const deselectBlock = useCallback((id: string) => {
    dispatch({ type: "DESELECT_BLOCK", payload: id });
  }, []);

  const selectEdge = useCallback((id: string) => {
    dispatch({ type: "SELECT_EDGE", payload: id });
  }, []);

  const deselectEdge = useCallback((id: string) => {
    dispatch({ type: "DESELECT_EDGE", payload: id });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, []);

  // Canvas interaction operations
  const setDragging = useCallback((dragging: boolean) => {
    dispatch({ type: "SET_DRAGGING", payload: dragging });
  }, []);

  const setConnecting = useCallback((connecting: boolean) => {
    dispatch({ type: "SET_CONNECTING", payload: connecting });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: "SET_ZOOM", payload: zoom });
  }, []);

  const setPan = useCallback((pan: { x: number; y: number }) => {
    dispatch({ type: "SET_PAN", payload: pan });
  }, []);

  // System operations
  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const resetCanvas = useCallback(() => {
    dispatch({ type: "RESET_CANVAS" });
  }, []);

  return {
    // State
    ...state,

    // Display operations
    setDisplayBlocks,
    setDisplayEdges,
    addDisplayBlock,
    updateDisplayBlock,
    deleteDisplayBlock,

    // Selection operations
    selectBlock,
    deselectBlock,
    selectEdge,
    deselectEdge,
    clearSelection,

    // Canvas interaction operations
    setDragging,
    setConnecting,
    setZoom,
    setPan,

    // System operations
    setError,
    resetCanvas,
  };
}
