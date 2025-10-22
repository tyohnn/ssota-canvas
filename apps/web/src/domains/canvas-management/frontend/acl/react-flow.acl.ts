import type { Node, Edge, BuiltInNode, BuiltInEdge } from '@xyflow/react';
import type { BlockDTO } from '@/domains/block-management/shared/dtos';
import type {
  BlockMountView,
  EdgeView,
  TransformBlockRequest,
  CreateEdgeRequest,
  CanvasViewData,
} from '../../shared/dtos';

/**
 * Basic Block 노드 데이터 타입
 * React Flow의 Record<string, unknown> 제약을 만족하도록 확장
 */
export interface BasicBlockNodeData extends Record<string, unknown> {
  blockMountId: string;
  blockId: string;
  blockType: 'basic';
  metadata?: Record<string, any>;
  size: { width: number; height: number };
  zOrder: number;
  isOptimistic?: boolean;
  position: { x: number; y: number };
  _optimisticId?: string;
}

/**
 * Basic Block 노드 타입 정의 (React Flow TypeScript 문서 방식)
 */
export type BasicBlockNode = Node<BasicBlockNodeData, 'basic'>;

/**
 * 확장 가능한 노드 타입 유니온 (향후 다른 블록 타입 추가 가능)
 */
export type CustomNodeType = BuiltInNode | BasicBlockNode;

/**
 * React Flow Node 데이터 타입 (기존 호환성 유지)
 */
export interface BlockNodeData extends Record<string, unknown> {
  blockMountId: string;
  blockId: string;
  blockType: string;
  metadata: Record<string, any>;
  size: { width: number; height: number };
  zOrder: number;
}

/**
 * DB → React Flow 변환 (초기 로드 시)
 */
export function toReactFlowNode(
  block: BlockDTO,
  blockMount: BlockMountView
): Node<BlockNodeData> {
  return {
    id: blockMount.blockMountId, // React Flow node ID
    type: block.blockType, // 노드 타입 (커스텀 컴포넌트)
    position: blockMount.position,
    data: {
      blockMountId: blockMount.blockMountId,
      blockId: block.id,
      blockType: block.blockType,
      metadata: block.metadata,
      size: blockMount.size,
      zOrder: blockMount.zOrder,
    },
    style: {
      width: blockMount.size.width,
      height: blockMount.size.height,
      zIndex: blockMount.zOrder,
    },
  };
}

/**
 * EdgeView를 React Flow Edge로 변환
 */
export function toReactFlowEdge(edge: EdgeView): Edge {
  return {
    id: edge.edgeId,
    source: edge.sourceBlockId, // React Flow 노드 ID 매핑
    target: edge.targetBlockId, // React Flow 노드 ID 매핑
    type: edge.edgeType || 'default',
    label: edge.label,
    style: edge.style,
    data: {
      edgeId: edge.edgeId,
      createdAt: edge.createdAt,
      updatedAt: edge.updatedAt,
    },
  };
}

/**
 * React Flow → DB 변환 (서버 저장 시)
 */
export function fromReactFlowNode(
  node: Node<BlockNodeData>
): TransformBlockRequest {
  const data = node.data as BlockNodeData;
  return {
    blockMountId: data.blockMountId,
    newPosition: node.position,
    newSize: data.size,
    newZOrder: data.zOrder,
  };
}

/**
 * React Flow Connection을 CreateEdge 요청으로 변환
 */
export function fromReactFlowConnection(
  pageId: string,
  connection: { source: string; target: string }
): CreateEdgeRequest {
  return {
    pageId,
    sourceBlockId: connection.source,
    targetBlockId: connection.target,
    edgeType: 'default',
  };
}

/**
 * BlockMountDTO를 React Flow Node로 변환 (서버 액션 결과 처리용)
 */
export function toReactFlowNodeFromMountDTO(
  block: BlockDTO,
  mountDTO: {
    blockMountId: string;
    blockId: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zOrder: number;
    mountedAt: string;
  }
): Node<BlockNodeData> {
  return {
    id: mountDTO.blockMountId,
    type: block.blockType,
    position: mountDTO.position,
    data: {
      blockMountId: mountDTO.blockMountId,
      blockId: mountDTO.blockId,
      blockType: block.blockType,
      metadata: block.metadata,
      size: mountDTO.size,
      zOrder: mountDTO.zOrder,
    },
    style: {
      width: mountDTO.size.width,
      height: mountDTO.size.height,
      zIndex: mountDTO.zOrder,
    },
  };
}

/**
 * CanvasViewData의 block을 React Flow Node로 변환
 */
export function toReactFlowNodeFromCanvasView(
  block: CanvasViewData['blocks'][0]
): Node<BlockNodeData> {
  return {
    id: block.blockMountId,
    type: block.blockType,
    position: block.position,
    data: {
      blockMountId: block.blockMountId,
      blockId: block.blockId,
      blockType: block.blockType,
      metadata: block.content,
      size: block.size,
      zOrder: block.zOrder,
    },
    style: {
      width: block.size.width,
      height: block.size.height,
      zIndex: block.zOrder,
    },
  };
}

/**
 * CanvasViewData의 edge를 React Flow Edge로 변환
 */
export function toReactFlowEdgeFromCanvasView(
  edge: CanvasViewData['edges'][0]
): Edge {
  return {
    id: edge.edgeId,
    source: edge.sourceBlockId,
    target: edge.targetBlockId,
    type: edge.edgeType || 'default',
    data: {
      edgeId: edge.edgeId,
    },
  };
}
