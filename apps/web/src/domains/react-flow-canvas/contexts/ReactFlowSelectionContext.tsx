'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';
import { useNodesData, useReactFlow } from '@xyflow/react';

// 선택 모드 타입
export type SelectionMode = 'none' | 'single' | 'multi';

// 선택 상태 타입
export interface SelectionState {
  // 노드 선택 상태
  selectedNodeIds: string[];
  selectedSingleNodeId: string | null;
  nodeSelectionMode: SelectionMode;

  // 엣지 선택 상태
  selectedEdgeIds: string[];
  selectedSingleEdgeId: string | null;
  edgeSelectionMode: SelectionMode;
}

// 선택 액션 타입
export type SelectionAction =
  | { type: 'SET_SELECTED_NODES'; payload: string[] }
  | { type: 'SET_SELECTED_EDGES'; payload: string[] }
  | { type: 'CLEAR_SELECTION' };

// 초기 선택 상태
const initialSelectionState: SelectionState = {
  // 노드 선택 상태
  selectedNodeIds: [],
  selectedSingleNodeId: null,
  nodeSelectionMode: 'none',

  // 엣지 선택 상태
  selectedEdgeIds: [],
  selectedSingleEdgeId: null,
  edgeSelectionMode: 'none',
};

// 선택 리듀서
function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case 'SET_SELECTED_NODES':
      return {
        ...state,
        selectedNodeIds: action.payload,
        selectedSingleNodeId:
          action.payload.length === 1 ? action.payload[0] || null : null,
        nodeSelectionMode:
          action.payload.length === 0
            ? 'none'
            : action.payload.length === 1
              ? 'single'
              : 'multi',
      };

    case 'SET_SELECTED_EDGES':
      return {
        ...state,
        selectedEdgeIds: action.payload,
        selectedSingleEdgeId:
          action.payload.length === 1 ? action.payload[0] || null : null,
        edgeSelectionMode:
          action.payload.length === 0
            ? 'none'
            : action.payload.length === 1
              ? 'single'
              : 'multi',
      };
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedNodeIds: [],
        selectedSingleNodeId: null,
        nodeSelectionMode: 'none',
        selectedEdgeIds: [],
        selectedSingleEdgeId: null,
        edgeSelectionMode: 'none',
      };

    default:
      return state;
  }
}

// 선택 명령 타입
export interface SelectionCommands {
  selectNodes: (nodeIds: string[]) => void;
  selectEdges: (edgeIds: string[]) => void;
  clearSelection: () => void;
  addToSelection: (nodeIds: string[]) => void;
  removeFromSelection: (nodeIds: string[]) => void;
  toggleNodeSelection: (nodeId: string) => void;
  toggleEdgeSelection: (edgeId: string) => void;
}

// 선택 컨텍스트 값 타입
export interface SelectionContextValue {
  state: SelectionState;
  commands: SelectionCommands;
}

// 컨텍스트 생성
const ReactFlowSelectionContext = createContext<SelectionContextValue | null>(
  null
);

// 프로바이더 컴포넌트
export function ReactFlowSelectionProvider({
  children,
  initialSelectedNodeIds = [],
  initialSelectedEdgeIds = [],
}: {
  children: React.ReactNode;
  initialSelectedNodeIds?: string[];
  initialSelectedEdgeIds?: string[];
}) {
  const [state, dispatch] = useReducer(selectionReducer, {
    ...initialSelectionState,
    selectedNodeIds: initialSelectedNodeIds,
    selectedEdgeIds: initialSelectedEdgeIds,
  });

  // 선택 명령들
  const commands: SelectionCommands = {
    selectNodes: useCallback((nodeIds: string[]) => {
      dispatch({ type: 'SET_SELECTED_NODES', payload: nodeIds });
    }, []),

    selectEdges: useCallback((edgeIds: string[]) => {
      dispatch({ type: 'SET_SELECTED_EDGES', payload: edgeIds });
    }, []),

    clearSelection: useCallback(() => {
      dispatch({ type: 'CLEAR_SELECTION' });
    }, []),

    addToSelection: useCallback(
      (nodeIds: string[]) => {
        const newSelection = [...state.selectedNodeIds];
        nodeIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        dispatch({ type: 'SET_SELECTED_NODES', payload: newSelection });
      },
      [state.selectedNodeIds]
    ),

    removeFromSelection: useCallback(
      (nodeIds: string[]) => {
        const newSelection = state.selectedNodeIds.filter(
          id => !nodeIds.includes(id)
        );
        dispatch({ type: 'SET_SELECTED_NODES', payload: newSelection });
      },
      [state.selectedNodeIds]
    ),

    toggleNodeSelection: useCallback(
      (nodeId: string) => {
        const isSelected = state.selectedNodeIds.includes(nodeId);
        if (isSelected) {
          const newSelection = state.selectedNodeIds.filter(
            id => id !== nodeId
          );
          dispatch({ type: 'SET_SELECTED_NODES', payload: newSelection });
        } else {
          const newSelection = [...state.selectedNodeIds, nodeId];
          dispatch({ type: 'SET_SELECTED_NODES', payload: newSelection });
        }
      },
      [state.selectedNodeIds]
    ),

    toggleEdgeSelection: useCallback(
      (edgeId: string) => {
        const isSelected = state.selectedEdgeIds.includes(edgeId);
        if (isSelected) {
          const newSelection = state.selectedEdgeIds.filter(
            id => id !== edgeId
          );
          dispatch({ type: 'SET_SELECTED_EDGES', payload: newSelection });
        } else {
          const newSelection = [...state.selectedEdgeIds, edgeId];
          dispatch({ type: 'SET_SELECTED_EDGES', payload: newSelection });
        }
      },
      [state.selectedEdgeIds]
    ),
  };

  const contextValue: SelectionContextValue = {
    state,
    commands,
  };

  return (
    <ReactFlowSelectionContext.Provider value={contextValue}>
      {children}
    </ReactFlowSelectionContext.Provider>
  );
}

// 훅
export function useReactFlowSelection() {
  const context = useContext(ReactFlowSelectionContext);
  if (!context) {
    throw new Error(
      'useSelection must be used within ReactFlowSelectionProvider'
    );
  }
  return context;
}

// 선택 상태만 가져오는 훅
export function useReactFlowSelectionState() {
  const { state } = useReactFlowSelection();
  return state;
}

// 선택 명령만 가져오는 훅
export function useReactFlowSelectionCommands() {
  const { commands } = useReactFlowSelection();
  return commands;
}

// 노드 선택 상태를 가져오는 훅
export function useReactFlowNodeSelection() {
  const reactFlow = useReactFlow();
  const { state } = useReactFlowSelection();

  // 단일 노드가 선택된 경우 해당 노드의 데이터 가져오기
  const singleNodeData = useNodesData(state.selectedSingleNodeId || '');
  const singleNode = reactFlow.getNode(state.selectedSingleNodeId || '');

  return {
    selectedNodeIds: state.selectedNodeIds,
    selectedSingleNode: singleNode,
    selectedSingleNodeId: state.selectedSingleNodeId,
    selectedSingleNodeData: state.selectedSingleNodeId ? singleNodeData : null,
    mode: state.nodeSelectionMode,
    isSelected: state.nodeSelectionMode !== 'none',
    isSingleSelected: state.nodeSelectionMode === 'single',
    isMultiSelected: state.nodeSelectionMode === 'multi',
    count: state.selectedNodeIds.length,
  };
}

// 엣지 선택 상태를 가져오는 훅
export function useReactFlowEdgeSelection() {
  const { state } = useReactFlowSelection();
  return {
    selectedEdgeIds: state.selectedEdgeIds,
    selectedSingleEdgeId: state.selectedSingleEdgeId,
    mode: state.edgeSelectionMode,
    isSelected: state.edgeSelectionMode !== 'none',
    isSingleSelected: state.edgeSelectionMode === 'single',
    isMultiSelected: state.edgeSelectionMode === 'multi',
    count: state.selectedEdgeIds.length,
  };
}

// 단일 노드 선택 상태만 가져오는 훅 (하위 호환성)
export function useReactFlowSingleNodeSelection() {
  const { state } = useReactFlowSelection();
  return {
    selectedNodeId: state.selectedSingleNodeId,
    isSelected: state.nodeSelectionMode === 'single',
    nodeData: state.selectedSingleNodeId ? state.selectedNodeIds : [],
  };
}

// 다중 노드 선택 상태만 가져오는 훅 (하위 호환성)
export function useReactFlowMultiNodeSelection() {
  const { state } = useReactFlowSelection();
  return {
    selectedNodeIds: state.selectedNodeIds,
    isSelected: state.nodeSelectionMode === 'multi',
    count: state.selectedNodeIds.length,
  };
}

// 단일 엣지 선택 상태만 가져오는 훅 (하위 호환성)
export function useReactFlowSingleEdgeSelection() {
  const { state } = useReactFlowSelection();
  return {
    selectedEdgeId: state.selectedSingleEdgeId,
    isSelected: state.edgeSelectionMode === 'single',
    edgeData: state.selectedSingleEdgeId ? state.selectedEdgeIds : [],
  };
}
