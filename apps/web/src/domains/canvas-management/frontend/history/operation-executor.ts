/**
 * Canvas History - Operation Executor
 * 
 * Operation을 실제로 실행하거나 되돌리는 로직
 */

import type { Node, Edge } from '@xyflow/react';
import type { CanvasOperation } from './types';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * Operation Executor Dependencies
 */
export interface OperationExecutorDeps {
  reactFlow: {
    addNodes: (nodes: Node[]) => void;
    deleteElements: (elements: { nodes?: Array<{ id: string }>; edges?: Array<{ id: string }> }) => void;
    setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
    getEdges: () => Edge[];
    updateNode: (nodeId: string, data: Partial<Node>) => void;
  };
  blockLifecycle: {
    softDeleteBlockMounts: (blockMountIds: string | string[]) => Promise<void>;
  };
  edgeLifecycle: {
    deleteEdge: (input: { edgeId: string }) => Promise<void>;
  };
}

/**
 * Operation을 실행 (Redo)
 */
export async function executeOperation(
  operation: CanvasOperation,
  deps: OperationExecutorDeps
): Promise<void> {
  const { reactFlow, blockLifecycle, edgeLifecycle } = deps;

  switch (operation.type) {
    case 'BLOCK_ADD': {
      // UI에 블록 추가 (서버 동기화는 이미 되어 있음)
      reactFlow.addNodes([operation.data.node]);
      break;
    }

    case 'BLOCK_DELETE': {
      // UI에서 블록 제거 및 서버 동기화
      reactFlow.deleteElements({ nodes: [{ id: operation.blockMountId }] });
      await blockLifecycle.softDeleteBlockMounts(operation.blockMountId);
      break;
    }

    case 'BLOCK_MOVE': {
      // 블록 위치 업데이트
      reactFlow.updateNode(operation.blockMountId, {
        position: operation.data.newPosition,
      });
      break;
    }

    case 'BLOCK_RESIZE': {
      // 블록 크기 업데이트
      reactFlow.updateNode(operation.blockMountId, {
        style: {
          width: operation.data.newSize.width,
          height: operation.data.newSize.height,
        },
      });
      break;
    }

    case 'EDGE_ADD': {
      // UI에 엣지 추가
      reactFlow.setEdges(edges => [...edges, operation.data.edge]);
      break;
    }

    case 'EDGE_DELETE': {
      // UI에서 엣지 제거 및 서버 동기화
      reactFlow.setEdges(edges => edges.filter(e => e.id !== operation.edgeId));
      await edgeLifecycle.deleteEdge({ edgeId: operation.edgeId });
      break;
    }

    default:
      console.warn('[executeOperation] Unknown operation type:', (operation as any).type);
  }
}

/**
 * Operation의 역(inverse)을 실행 (Undo)
 */
export async function executeInverseOperation(
  operation: CanvasOperation,
  deps: OperationExecutorDeps
): Promise<void> {
  const { reactFlow, blockLifecycle, edgeLifecycle } = deps;

  switch (operation.type) {
    case 'BLOCK_ADD': {
      // 블록 추가의 역 = 블록 삭제
      reactFlow.deleteElements({ nodes: [{ id: operation.blockMountId }] });
      await blockLifecycle.softDeleteBlockMounts(operation.blockMountId);
      break;
    }

    case 'BLOCK_DELETE': {
      // 블록 삭제의 역 = 블록 복원
      reactFlow.addNodes([operation.data.node]);
      // TODO: 서버에 복원 요청 (restore API 필요)
      break;
    }

    case 'BLOCK_MOVE': {
      // 이동의 역 = 이전 위치로 복원
      reactFlow.updateNode(operation.blockMountId, {
        position: operation.data.previousPosition,
      });
      break;
    }

    case 'BLOCK_RESIZE': {
      // 리사이즈의 역 = 이전 크기로 복원
      reactFlow.updateNode(operation.blockMountId, {
        style: {
          width: operation.data.previousSize.width,
          height: operation.data.previousSize.height,
        },
      });
      break;
    }

    case 'EDGE_ADD': {
      // 엣지 추가의 역 = 엣지 삭제
      reactFlow.setEdges(edges => edges.filter(e => e.id !== operation.edgeId));
      await edgeLifecycle.deleteEdge({ edgeId: operation.edgeId });
      break;
    }

    case 'EDGE_DELETE': {
      // 엣지 삭제의 역 = 엣지 복원
      reactFlow.setEdges(edges => [...edges, operation.data.edge]);
      // TODO: 서버에 복원 요청 (restore API 필요)
      break;
    }

    default:
      console.warn('[executeInverseOperation] Unknown operation type:', (operation as any).type);
  }
}
