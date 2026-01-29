'use client';

import { createContext, useCallback, useContext, useReducer } from 'react';

import { useReactFlow } from '@xyflow/react';

import {
  canvasSnapshotReducer,
  initialSnapshotState,
} from './canvas-snapshot.reducer';
import type { CanvasSnapshotContextType } from './types';

/**
 * Canvas Snapshot Context
 * 
 * Undo/Redo 기능을 위한 스냅샷 관리 Context
 * ReactFlowProvider 내부에서만 사용 가능
 */
const CanvasSnapshotContext = createContext<CanvasSnapshotContextType | null>(null);

/**
 * CanvasSnapshotProvider
 * 
 * ReactFlowProvider 내부에 배치해야 함 (useReactFlow 사용)
 */
export function CanvasSnapshotProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(canvasSnapshotReducer, initialSnapshotState);
  const reactFlowInstance = useReactFlow();

  /**
   * 현재 캔버스 상태를 스냅샷으로 저장
   * 각 mutation 전에 호출하여 "변경 전" 상태를 저장
   */
  const takeSnapshot = useCallback(() => {
    const nodes = reactFlowInstance.getNodes();
    const edges = reactFlowInstance.getEdges();
    dispatch({ type: 'TAKE_SNAPSHOT', payload: { nodes, edges } });
  }, [reactFlowInstance]);

  /**
   * Undo - 이전 상태로 복원
   */
  const undo = useCallback(() => {
    if (state.past.length === 0) return;

    const currentNodes = reactFlowInstance.getNodes();
    const currentEdges = reactFlowInstance.getEdges();

    // Reducer에서 상태 업데이트
    dispatch({ type: 'UNDO', payload: { currentNodes, currentEdges } });

    // 이전 스냅샷으로 복원
    const previousSnapshot = state.past[state.past.length - 1];
    if (previousSnapshot) {
      reactFlowInstance.setNodes(previousSnapshot.nodes);
      reactFlowInstance.setEdges(previousSnapshot.edges);
    }
  }, [reactFlowInstance, state.past]);

  /**
   * Redo - 다음 상태로 복원
   */
  const redo = useCallback(() => {
    if (state.future.length === 0) return;

    const currentNodes = reactFlowInstance.getNodes();
    const currentEdges = reactFlowInstance.getEdges();

    // Reducer에서 상태 업데이트
    dispatch({ type: 'REDO', payload: { currentNodes, currentEdges } });

    // 다음 스냅샷으로 복원
    const nextSnapshot = state.future[0];
    if (nextSnapshot) {
      reactFlowInstance.setNodes(nextSnapshot.nodes);
      reactFlowInstance.setEdges(nextSnapshot.edges);
    }
  }, [reactFlowInstance, state.future]);

  const value: CanvasSnapshotContextType = {
    takeSnapshot,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };

  return (
    <CanvasSnapshotContext.Provider value={value}>
      {children}
    </CanvasSnapshotContext.Provider>
  );
}

/**
 * useCanvasSnapshot Hook
 * 
 * @throws Error if used outside CanvasSnapshotProvider
 */
export function useCanvasSnapshot(): CanvasSnapshotContextType {
  const context = useContext(CanvasSnapshotContext);
  if (!context) {
    throw new Error('useCanvasSnapshot must be used within CanvasSnapshotProvider');
  }
  return context;
}
