"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { Node, Edge } from "@xyflow/react";
import { getWorkspaceNodes } from "../actions/node.action";
import { getEdgesBySource, getEdgesByTarget } from "../actions/edge.action";

// Canvas state types
export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodes: string[];
  selectedEdges: string[];
  isDragging: boolean;
  isConnecting: boolean;
  connectionMode: "add" | "edit" | "delete";
  zoom: number;
  pan: { x: number; y: number };
  loading: boolean;
  error: string | null;
}

// Canvas actions
export type CanvasAction =
  | { type: "SET_NODES"; payload: Node[] }
  | { type: "ADD_NODE"; payload: Node }
  | {
      type: "UPDATE_NODE";
      payload: { id: string; data: Partial<Node["data"]> };
    }
  | { type: "DELETE_NODE"; payload: string }
  | { type: "SET_EDGES"; payload: Edge[] }
  | { type: "ADD_EDGE"; payload: Edge }
  | {
      type: "UPDATE_EDGE";
      payload: { id: string; data: Partial<Edge["data"]> };
    }
  | { type: "DELETE_EDGE"; payload: string }
  | { type: "SELECT_NODE"; payload: string }
  | { type: "DESELECT_NODE"; payload: string }
  | { type: "SELECT_EDGE"; payload: string }
  | { type: "DESELECT_EDGE"; payload: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_DRAGGING"; payload: boolean }
  | { type: "SET_CONNECTING"; payload: boolean }
  | { type: "SET_CONNECTION_MODE"; payload: "add" | "edit" | "delete" }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "SET_PAN"; payload: { x: number; y: number } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET_CANVAS" };

// Initial state
const initialState: CanvasState = {
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
  isDragging: false,
  isConnecting: false,
  connectionMode: "add",
  zoom: 1,
  pan: { x: 0, y: 0 },
  loading: false,
  error: null,
};

// Canvas reducer
function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case "SET_NODES":
      return { ...state, nodes: action.payload };

    case "ADD_NODE":
      return { ...state, nodes: [...state.nodes, action.payload] };

    case "UPDATE_NODE":
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === action.payload.id
            ? { ...node, data: { ...node.data, ...action.payload.data } }
            : node
        ),
      };

    case "DELETE_NODE":
      return {
        ...state,
        nodes: state.nodes.filter((node) => node.id !== action.payload),
        edges: state.edges.filter(
          (edge) =>
            edge.source !== action.payload && edge.target !== action.payload
        ),
        selectedNodes: state.selectedNodes.filter(
          (id) => id !== action.payload
        ),
      };

    case "SET_EDGES":
      return { ...state, edges: action.payload };

    case "ADD_EDGE":
      return { ...state, edges: [...state.edges, action.payload] };

    case "UPDATE_EDGE":
      return {
        ...state,
        edges: state.edges.map((edge) =>
          edge.id === action.payload.id
            ? { ...edge, data: { ...edge.data, ...action.payload.data } }
            : edge
        ),
      };

    case "DELETE_EDGE":
      return {
        ...state,
        edges: state.edges.filter((edge) => edge.id !== action.payload),
        selectedEdges: state.selectedEdges.filter(
          (id) => id !== action.payload
        ),
      };

    case "SELECT_NODE":
      return {
        ...state,
        selectedNodes: [...state.selectedNodes, action.payload],
        selectedEdges: state.selectedEdges.filter(
          (id) => id !== action.payload
        ),
      };

    case "DESELECT_NODE":
      return {
        ...state,
        selectedNodes: state.selectedNodes.filter(
          (id) => id !== action.payload
        ),
      };

    case "SELECT_EDGE":
      return {
        ...state,
        selectedEdges: [...state.selectedEdges, action.payload],
        selectedNodes: state.selectedNodes.filter(
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
        selectedNodes: [],
        selectedEdges: [],
      };

    case "SET_DRAGGING":
      return { ...state, isDragging: action.payload };

    case "SET_CONNECTING":
      return { ...state, isConnecting: action.payload };

    case "SET_CONNECTION_MODE":
      return { ...state, connectionMode: action.payload };

    case "SET_ZOOM":
      return { ...state, zoom: action.payload };

    case "SET_PAN":
      return { ...state, pan: action.payload };

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
 * Custom hook for managing canvas state
 */
export function useCanvasState(workspaceId: string) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial canvas data
  useEffect(() => {
    if (!workspaceId) return;

    const loadCanvasData = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        // Cancel previous request if it exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        // Load nodes and edges in parallel
        const [nodesResult, edgesResult] = await Promise.all([
          getWorkspaceNodes(workspaceId),
          getEdgesBySource(workspaceId), // This would need to be adjusted for workspace edges
        ]);

        if (nodesResult.success && nodesResult.data) {
          // Convert database nodes to React Flow nodes
          const reactFlowNodes: Node[] = nodesResult.data.map(
            (dbNode: any) => ({
              id: dbNode.id,
              type: dbNode.node_type,
              position: dbNode.position || { x: 0, y: 0 },
              data: {
                ...dbNode.metadata,
                label: dbNode.name,
                slug: dbNode.slug,
              },
            })
          );

          dispatch({ type: "SET_NODES", payload: reactFlowNodes });
        }

        if (edgesResult.success && edgesResult.data) {
          // Convert database edges to React Flow edges
          const reactFlowEdges: Edge[] = edgesResult.data.map(
            (dbEdge: any) => ({
              id: dbEdge.id,
              source: dbEdge.source_node_id,
              target: dbEdge.target_node_id,
              type: dbEdge.edge_type,
              data: dbEdge.metadata || {},
            })
          );

          dispatch({ type: "SET_EDGES", payload: reactFlowEdges });
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          dispatch({ type: "SET_ERROR", payload: error.message });
        }
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    loadCanvasData();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [workspaceId]);

  // Node operations
  const addNode = useCallback((node: Node) => {
    dispatch({ type: "ADD_NODE", payload: node });
  }, []);

  const updateNode = useCallback((id: string, data: Partial<Node["data"]>) => {
    dispatch({ type: "UPDATE_NODE", payload: { id, data } });
  }, []);

  const deleteNode = useCallback((id: string) => {
    dispatch({ type: "DELETE_NODE", payload: id });
  }, []);

  // Edge operations
  const addEdge = useCallback((edge: Edge) => {
    dispatch({ type: "ADD_EDGE", payload: edge });
  }, []);

  const updateEdge = useCallback((id: string, data: Partial<Edge["data"]>) => {
    dispatch({ type: "UPDATE_EDGE", payload: { id, data } });
  }, []);

  const deleteEdge = useCallback((id: string) => {
    dispatch({ type: "DELETE_EDGE", payload: id });
  }, []);

  // Selection operations
  const selectNode = useCallback((id: string) => {
    dispatch({ type: "SELECT_NODE", payload: id });
  }, []);

  const deselectNode = useCallback((id: string) => {
    dispatch({ type: "DESELECT_NODE", payload: id });
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
  const setDragging = useCallback((isDragging: boolean) => {
    dispatch({ type: "SET_DRAGGING", payload: isDragging });
  }, []);

  const setConnecting = useCallback((isConnecting: boolean) => {
    dispatch({ type: "SET_CONNECTING", payload: isConnecting });
  }, []);

  const setConnectionMode = useCallback((mode: "add" | "edit" | "delete") => {
    dispatch({ type: "SET_CONNECTION_MODE", payload: mode });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: "SET_ZOOM", payload: zoom });
  }, []);

  const setPan = useCallback((pan: { x: number; y: number }) => {
    dispatch({ type: "SET_PAN", payload: pan });
  }, []);

  // Utility operations
  const resetCanvas = useCallback(() => {
    dispatch({ type: "RESET_CANVAS" });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  // Computed values
  const selectedNode =
    state.selectedNodes.length === 1
      ? state.nodes.find((n) => n.id === state.selectedNodes[0])
      : null;
  const selectedEdge =
    state.selectedEdges.length === 1
      ? state.edges.find((e) => e.id === state.selectedEdges[0])
      : null;
  const hasSelection =
    state.selectedNodes.length > 0 || state.selectedEdges.length > 0;

  return {
    // State
    ...state,
    selectedNode,
    selectedEdge,
    hasSelection,

    // Node operations
    addNode,
    updateNode,
    deleteNode,

    // Edge operations
    addEdge,
    updateEdge,
    deleteEdge,

    // Selection operations
    selectNode,
    deselectNode,
    selectEdge,
    deselectEdge,
    clearSelection,

    // Canvas interaction operations
    setDragging,
    setConnecting,
    setConnectionMode,
    setZoom,
    setPan,

    // Utility operations
    resetCanvas,
    setError,
  };
}
