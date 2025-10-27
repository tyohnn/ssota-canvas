import type { Node, Edge, BuiltInNode, BuiltInEdge } from '@xyflow/react';
import type { BlockDTO } from '@/domains/block-management/shared/dtos';
import type {
  BlockMountView,
  EdgeView,
  TransformBlockRequest,
  CreateEdgeRequest,
  CanvasViewData,
} from '../../shared/dtos';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import {
  BaseNodeData,
  MarkdownBlockNodeData,
  YoutubeBlockNodeData,
  ImageBlockNodeData,
  PythonBlockNodeData,
  BlockNodeData,
  CustomPropertyDefinition,
} from '@/domains/block-management/shared/types/block-data.types';

// 블록 노드 데이터 타입들은 block-data.types.ts에서 import

/**
 * 각 블록 타입별 React Flow 노드 타입 정의
 */
export type DefaultBlockNode = Node<BaseNodeData, 'default'>;
export type MarkdownBlockNode = Node<MarkdownBlockNodeData, 'markdown'>;
export type YoutubeBlockNode = Node<YoutubeBlockNodeData, 'youtube'>;
export type ImageBlockNode = Node<ImageBlockNodeData, 'image'>;
export type PythonBlockNode = Node<PythonBlockNodeData, 'python'>;

/**
 * 확장 가능한 노드 타입 유니온 (모든 블록 타입 포함)
 */
export type CustomNodeType =
  | BuiltInNode
  | DefaultBlockNode
  | MarkdownBlockNode
  | YoutubeBlockNode
  | ImageBlockNode
  | PythonBlockNode;

/**
 * Clean nested properties recursively
 * Prevents infinite nesting of 'properties' within 'properties'
 */
function cleanNestedProperties(properties: any): any {
  if (!properties || typeof properties !== 'object') {
    return properties;
  }

  const cleaned = { ...properties };

  // Remove nested 'properties' key if it exists
  if (cleaned.properties) {
    delete cleaned.properties;
  }

  return cleaned;
}

/**
 * BlockDTO를 BaseNodeData로 변환 (ACL에서 직접 처리)
 */
export function transformBlockDTOToNodeData(
  blockDTO: BlockDTO,
  blockMountId: string,
  additionalData: {
    pageId?: string;
    orgId?: string;
    workspaceId?: string;
  } = {}
): BaseNodeData {
  return {
    blockMountId,
    blockId: blockDTO.id,
    blockType: blockDTO.blockType,
    properties: cleanNestedProperties(blockDTO.properties),
    customProperties: blockDTO.customProperties,
    metadata: blockDTO.metadata,
    pageId: additionalData.pageId,
    orgId: additionalData.orgId,
    workspaceId: additionalData.workspaceId,
    createdAt: blockDTO.createdAt,
    updatedAt: blockDTO.updatedAt,
    createdBy: blockDTO.createdBy,
  };
}

/**
 * DB → React Flow 변환 (초기 로드 시)
 */
export function toReactFlowNode(
  block: BlockDTO,
  blockMount: BlockMountView
): Node<BaseNodeData> {
  return {
    id: blockMount.blockMountId, // React Flow node ID
    type: block.blockType, // 노드 타입 (커스텀 컴포넌트)
    position: blockMount.position,
    data: transformBlockDTOToNodeData(block, blockMount.blockMountId),
    width: blockMount.size.width,
    height: blockMount.size.height,
    zIndex: blockMount.zOrder,
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
    type: 'custom', // 항상 custom 타입 사용 (CustomEdge 컴포넌트 사용)
    label: edge.label,
    style: edge.style,
    data: {
      edgeId: edge.edgeId,
      actualEdgeShape: edge.edgeShape || 'default', // 실제 엣지 모양 저장
      pageId: edge.pageId,
      createdAt: edge.createdAt,
      updatedAt: edge.updatedAt,
    },
  };
}

/**
 * React Flow → DB 변환 (서버 저장 시)
 */
export function fromReactFlowNode(
  node: Node<BaseNodeData>
): TransformBlockRequest {
  const data = node.data as BaseNodeData;
  return {
    blockMountId: data.blockMountId,
    newPosition: node.position,
    newSize: { width: node.width || 0, height: node.height || 0 },
    newZOrder: node.zIndex || 0,
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
): Node<BaseNodeData> {
  return {
    id: mountDTO.blockMountId,
    type: block.blockType,
    position: mountDTO.position,
    data: {
      blockMountId: mountDTO.blockMountId,
      blockId: mountDTO.blockId,
      blockType: block.blockType as BlockType,
      properties: block.properties,
      customProperties: block.customProperties,
      metadata: block.metadata,
    },
    width: mountDTO.size.width,
    height: mountDTO.size.height,
    zIndex: mountDTO.zOrder,
  };
}

/**
 * CanvasViewData의 block을 React Flow Node로 변환
 */
export function toReactFlowNodeFromCanvasView(
  block: CanvasViewData['blocks'][0]
): Node<BaseNodeData> {
  return {
    id: block.blockMountId,
    type: block.blockType,
    position: block.position,
    data: {
      blockMountId: block.blockMountId,
      blockId: block.blockId,
      blockType: block.blockType as BlockType,
      properties: cleanNestedProperties(block.properties || {}),
      customProperties: block.customProperties as CustomPropertyDefinition[],
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
      createdBy: block.createdBy,
    },
    width: block.size.width,
    height: block.size.height,
    zIndex: block.zOrder,
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
    type: 'custom', // 항상 custom 타입 사용 (CustomEdge 컴포넌트 사용)
    label: edge.label,
    style: edge.style,
    data: {
      edgeId: edge.edgeId,
      actualEdgeShape: edge.edgeShape || 'default', // 실제 엣지 모양 저장
      pageId: edge.pageId,
    },
  };
}
