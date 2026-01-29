import type { Edge, Node } from '@xyflow/react';

/**
 * 캔버스 스냅샷 - 특정 시점의 노드/엣지 상태
 */
export interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

/**
 * 스냅샷 상태 - past/future 스택
 */
export interface CanvasSnapshotState {
  past: CanvasSnapshot[];
  future: CanvasSnapshot[];
  maxHistorySize: number;
}

/**
 * Context에서 제공하는 API
 */
export interface CanvasSnapshotContextType {
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Reducer Action Types
 */
export type CanvasSnapshotAction =
  | { type: 'TAKE_SNAPSHOT'; payload: { nodes: Node[]; edges: Edge[] } }
  | { type: 'UNDO'; payload: { currentNodes: Node[]; currentEdges: Edge[] } }
  | { type: 'REDO'; payload: { currentNodes: Node[]; currentEdges: Edge[] } }
  | { type: 'CLEAR' };
