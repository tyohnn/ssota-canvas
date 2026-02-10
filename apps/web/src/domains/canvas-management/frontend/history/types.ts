/**
 * Canvas History - Type Definitions
 * 
 * Undo/Redo를 위한 Operation 기반 히스토리 타입 정의
 */

import type { Node, Edge } from '@xyflow/react';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';

/**
 * Canvas에서 발생할 수 있는 모든 작업(Operation) 타입
 */
export type CanvasOperationType =
  | 'BLOCK_ADD'
  | 'BLOCK_DELETE'
  | 'BLOCK_MOVE'
  | 'BLOCK_RESIZE'
  | 'BLOCK_CONTENT_UPDATE'
  | 'EDGE_ADD'
  | 'EDGE_DELETE'
  | 'EDGE_RECONNECT';

/**
 * 개별 Operation 데이터 구조
 */
export type CanvasOperation =
  | BlockAddOperation
  | BlockDeleteOperation
  | BlockMoveOperation
  | BlockResizeOperation
  | BlockContentUpdateOperation
  | EdgeAddOperation
  | EdgeDeleteOperation
  | EdgeReconnectOperation;

/**
 * Block 추가 Operation
 */
export interface BlockAddOperation {
  type: 'BLOCK_ADD';
  blockMountId: string;
  data: {
    node: Node;
    blockId: string;
    blockType: BlockType;
    position: { x: number; y: number };
    initialProperties?: Record<string, any>;
    initialContent?: unknown;
    title?: string;
  };
}

/**
 * Block 삭제 Operation
 */
export interface BlockDeleteOperation {
  type: 'BLOCK_DELETE';
  blockMountId: string;
  data: {
    node: Node;
    blockId: string;
  };
}

/**
 * Block 이동 Operation
 */
export interface BlockMoveOperation {
  type: 'BLOCK_MOVE';
  blockMountId: string;
  data: {
    previousPosition: { x: number; y: number };
    newPosition: { x: number; y: number };
  };
}

/**
 * Block 리사이즈 Operation
 */
export interface BlockResizeOperation {
  type: 'BLOCK_RESIZE';
  blockMountId: string;
  data: {
    previousSize: { width: number; height: number };
    newSize: { width: number; height: number };
  };
}

/**
 * Block 콘텐츠 업데이트 Operation
 */
export interface BlockContentUpdateOperation {
  type: 'BLOCK_CONTENT_UPDATE';
  blockMountId: string;
  data: {
    blockId: string;
    previousContent: unknown;
    newContent: unknown;
  };
}

/**
 * Edge 추가 Operation
 */
export interface EdgeAddOperation {
  type: 'EDGE_ADD';
  edgeId: string;
  data: {
    edge: Edge;
    source: string;
    target: string;
  };
}

/**
 * Edge 삭제 Operation
 */
export interface EdgeDeleteOperation {
  type: 'EDGE_DELETE';
  edgeId: string;
  data: {
    edge: Edge;
    source: string;
    target: string;
  };
}

/**
 * Edge 재연결 Operation
 */
export interface EdgeReconnectOperation {
  type: 'EDGE_RECONNECT';
  edgeId: string;
  data: {
    previousSource: string;
    previousTarget: string;
    previousSourceHandle: string | null;
    previousTargetHandle: string | null;
    newSource: string;
    newTarget: string;
    newSourceHandle: string | null;
    newTargetHandle: string | null;
    newEdgeId?: string; // 재연결로 생성된 새 엣지 ID (있으면 이 ID를 복구/삭제)
  };
}

/**
 * History Entry - 하나의 사용자 액션을 나타냄
 * 여러 Operation을 포함할 수 있음 (예: 블록 복사 = 블록 추가 + 엣지 추가)
 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  operations: CanvasOperation[];
  description?: string;
}

/**
 * History State - 전체 히스토리 상태
 */
export interface CanvasHistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  currentBatch: CanvasOperation[] | null; // 배치 작업 중인 operations
}
