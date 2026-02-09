import type { CanvasSnapshot, CanvasSnapshotAction, CanvasSnapshotState } from './types';

/**
 * 초기 상태
 */
export const initialSnapshotState: CanvasSnapshotState = {
  past: [],
  future: [],
  maxHistorySize: 50,
};

/**
 * 스냅샷 Reducer
 * 
 * - TAKE_SNAPSHOT: 현재 상태를 past에 추가, future 초기화
 * - UNDO: past에서 꺼내서 반환, 현재 상태를 future에 추가
 * - REDO: future에서 꺼내서 반환, 현재 상태를 past에 추가
 */
export function canvasSnapshotReducer(
  state: CanvasSnapshotState,
  action: CanvasSnapshotAction
): CanvasSnapshotState {
  switch (action.type) {
    case 'TAKE_SNAPSHOT': {
      const { nodes, edges } = action.payload;
      const newSnapshot: CanvasSnapshot = {
        nodes: JSON.parse(JSON.stringify(nodes)), // Deep copy
        edges: JSON.parse(JSON.stringify(edges)),
        timestamp: Date.now(),
      };

      const newPast = [...state.past, newSnapshot];
      
      // maxHistorySize 초과 시 오래된 것부터 제거
      if (newPast.length > state.maxHistorySize) {
        newPast.shift();
      }

      return {
        ...state,
        past: newPast,
        future: [], // 새 액션 시 future 초기화
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;

      const { currentNodes, currentEdges } = action.payload;
      const newPast = [...state.past];
      const previousSnapshot = newPast.pop()!;

      // 현재 상태를 future에 저장
      const currentSnapshot: CanvasSnapshot = {
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges)),
        timestamp: Date.now(),
      };

      return {
        ...state,
        past: newPast,
        future: [currentSnapshot, ...state.future],
        _lastUndoSnapshot: previousSnapshot, // 복원할 스냅샷 (임시 저장)
      } as CanvasSnapshotState & { _lastUndoSnapshot: CanvasSnapshot };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;

      const { currentNodes, currentEdges } = action.payload;
      const newFuture = [...state.future];
      const nextSnapshot = newFuture.shift()!;

      // 현재 상태를 past에 저장
      const currentSnapshot: CanvasSnapshot = {
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges)),
        timestamp: Date.now(),
      };

      return {
        ...state,
        past: [...state.past, currentSnapshot],
        future: newFuture,
        _lastRedoSnapshot: nextSnapshot, // 복원할 스냅샷 (임시 저장)
      } as CanvasSnapshotState & { _lastRedoSnapshot: CanvasSnapshot };
    }

    case 'CLEAR': {
      return initialSnapshotState;
    }

    default:
      return state;
  }
}
