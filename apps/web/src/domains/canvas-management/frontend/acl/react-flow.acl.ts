import type { Node, Edge, BuiltInNode, BuiltInEdge } from '@xyflow/react';
import type { BlockView } from '../../shared/dtos/views/block.views';
import type {
  BlockMountView,
  EdgeView,
  TransformBlockDTO,
  CreateEdgeRequest,
  CanvasViewData,
} from '../../shared/dtos';
import {
  BaseNodeData,
  TextBlockNodeData,
  ShapeBlockNodeData,
  LinkBlockNodeData,
  MarkdownBlockNodeData,
  YoutubeBlockNodeData,
  ImageBlockNodeData,
  PythonBlockNodeData,
  PdfBlockNodeData,
  AudioBlockNodeData,
  BlockNodeData,
} from '@/domains/block-management/shared/types/block-data.types';

// 블록 노드 데이터 타입들은 block-data.types.ts에서 import

/**
 * 각 블록 타입별 React Flow 노드 타입 정의
 */
export type DefaultBlockNode = Node<BaseNodeData, 'default'>;
export type TextBlockNode = Node<TextBlockNodeData, 'text'>;
export type ShapeBlockNode = Node<ShapeBlockNodeData, 'shape'>;
export type MarkdownBlockNode = Node<MarkdownBlockNodeData, 'markdown'>;
export type LinkBlockNode = Node<LinkBlockNodeData, 'link'>;
export type YoutubeBlockNode = Node<YoutubeBlockNodeData, 'youtube'>;
export type ImageBlockNode = Node<ImageBlockNodeData, 'image'>;
export type PythonBlockNode = Node<PythonBlockNodeData, 'python'>;
export type PdfBlockNode = Node<PdfBlockNodeData, 'pdf'>;
export type AudioBlockNode = Node<AudioBlockNodeData, 'audio'>;

/**
 * 확장 가능한 노드 타입 유니온 (모든 블록 타입 포함)
 */
export type CustomNodeType =
  | BuiltInNode
  | DefaultBlockNode
  | TextBlockNode
  | ShapeBlockNode
  | LinkBlockNode
  | ImageBlockNode
  | MarkdownBlockNode
  | YoutubeBlockNode
  | PythonBlockNode
  | PdfBlockNode
  | AudioBlockNode;

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
 * BlockView를 BaseNodeData로 변환 (ACL에서 직접 처리)
 */
export function transformBlockViewToNodeData(
  blockView: BlockView,
  blockMountId: string,
  additionalData: {
    pageId?: string;
    orgId?: string;
    workspaceId?: string;
  } = {}
): BaseNodeData {
  if (
    !additionalData.pageId ||
    !additionalData.orgId ||
    !additionalData.workspaceId
  ) {
    throw new Error(
      'pageId, orgId, and workspaceId are required for BaseNodeData'
    );
  }

  return {
    blockMountId,
    blockId: blockView.blockId,
    blockType: blockView.blockType,
    title: blockView.title,
    properties: cleanNestedProperties(blockView.properties),
    customProperties: blockView.customProperties,
    content: blockView.content, // JSONB content
    pageId: additionalData.pageId,
    orgId: additionalData.orgId,
    workspaceId: additionalData.workspaceId,
    createdAt: blockView.createdAt,
    updatedAt: blockView.updatedAt,
    createdByProfile: blockView.createdByProfile || {
      userId: 'unknown',
      email: null,
      name: null,
      profileImageUrl: null,
    },
  };
}

/**
 * DB → React Flow 변환 (초기 로드 시)
 */
export function toReactFlowNode(
  block: BlockView,
  blockMount: BlockMountView
): Node<BaseNodeData> {
  return {
    id: blockMount.blockMountId, // React Flow node ID
    type: block.blockType, // 노드 타입 (커스텀 컴포넌트)
    position: blockMount.position,
    data: transformBlockViewToNodeData(block, blockMount.blockMountId),
    width: blockMount.size.width,
    height: blockMount.size.height,
    zIndex: blockMount.zOrder,
  };
}

/**
 * EdgeView를 React Flow Edge로 변환
 *
 * ⚠️ Schema Change: edges now use block_mount IDs (React Flow node IDs)
 */
export function toReactFlowEdge(edge: EdgeView): Edge {
  return {
    id: edge.edgeId,
    source: edge.sourceBlockMountId, // ✅ blockMountId = React Flow node ID
    target: edge.targetBlockMountId, // ✅ blockMountId = React Flow node ID
    sourceHandle: edge.sourceHandle, // ✅ React Flow handle ID
    targetHandle: edge.targetHandle, // ✅ React Flow handle ID
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
export function fromReactFlowNode(node: Node<BaseNodeData>): TransformBlockDTO {
  const data = node.data as BaseNodeData;
  return {
    blockMountId: data.blockMountId,
    position: node.position,
    size: { width: node.width || 0, height: node.height || 0 },
    zOrder: node.zIndex || 0,
    transformedAt: new Date().toISOString(),
  };
}

/**
 * React Flow Connection을 CreateEdge 요청으로 변환
 *
 * ⚠️ Schema Change: connection.source/target are blockMountIds
 */
export function fromReactFlowConnection(
  pageId: string,
  connection: {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  },
  additionalData: {
    workspaceId: string;
    orgId: string;
    edgeShape?: string;
  }
): CreateEdgeRequest {
  return {
    pageId,
    sourceBlockMountId: connection.source, // ✅ React Flow node ID = blockMountId
    targetBlockMountId: connection.target, // ✅ React Flow node ID = blockMountId
    sourceHandle: connection.sourceHandle || undefined,
    targetHandle: connection.targetHandle || undefined,
    edgeShape: additionalData.edgeShape || 'default',
    workspaceId: additionalData.workspaceId,
    orgId: additionalData.orgId,
  };
}

/**
 * BlockMountDTO를 React Flow Node로 변환 (서버 액션 결과 처리용)
 *
 * 반환 타입을 CustomNodeType으로 선언하여 타입 안전성을 보장
 */
export function toReactFlowNodeFromMountDTO(
  block: BlockView,
  mountDTO: {
    blockMountId: string;
    blockId: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zOrder: number;
    mountedAt: string;
  },
  additionalData: {
    pageId: string;
    orgId: string;
    workspaceId: string;
  }
): CustomNodeType {
  const node: Node<BaseNodeData> = {
    id: mountDTO.blockMountId,
    type: block.blockType,
    position: mountDTO.position,
    data: {
      blockMountId: mountDTO.blockMountId,
      blockId: mountDTO.blockId,
      blockType: block.blockType,
      title: block.title,
      properties: block.properties,
      customProperties: block.customProperties,
      content: block.content, // JSONB content
      pageId: additionalData.pageId,
      orgId: additionalData.orgId,
      workspaceId: additionalData.workspaceId,
      createdByProfile: block.createdByProfile || {
        userId: 'unknown',
        email: null,
        name: null,
        profileImageUrl: null,
      },
    },
    width: mountDTO.size.width,
    height: mountDTO.size.height,
    zIndex: mountDTO.zOrder,
  };

  // 타입 가드를 통과하면 CustomNodeType으로 취급
  return node as CustomNodeType;
}

/**
 * 타입 가드: Node가 CustomNodeType인지 확인
 *
 * 런타임 검증을 통해 타입 안전성을 보장하면서도
 * 타입 시스템에서는 CustomNodeType으로 처리할 수 있게 함
 */
export function isCustomNodeType(
  node: Node | CustomNodeType
): node is CustomNodeType {
  // BuiltInNode는 항상 CustomNodeType에 포함됨
  if (!node.data || typeof node.data !== 'object') {
    return false;
  }

  // blockType이 있는 경우 (커스텀 블록)
  if ('blockType' in node.data) {
    const validBlockTypes = [
      'default',
      'text',
      'shape',
      'markdown',
      'youtube',
      'image',
      'link',
      'python',
      'pdf',
      'audio',
    ];
    return validBlockTypes.includes(node.data.blockType as string);
  }

  // BuiltInNode 타입 (input, output, default)인 경우
  // React Flow의 기본 노드 타입
  const builtInTypes = ['input', 'output', 'default'];
  return builtInTypes.includes(node.type || '');
}

/**
 * CanvasViewData의 block을 React Flow Node로 변환
 *
 * 반환 타입을 CustomNodeType으로 선언하여 타입 안전성을 보장하되,
 * 실제 구현은 BaseNodeData 구조를 반환합니다.
 * 런타임에서는 blockType에 따라 올바른 구체 타입으로 동작합니다.
 */
export function toReactFlowNodeFromCanvasView(
  block: CanvasViewData['blocks'][0],
  additionalData: {
    pageId: string;
    orgId: string;
    workspaceId: string;
  }
): CustomNodeType {
  const node: Node<BaseNodeData> = {
    id: block.blockMountId,
    type: block.blockType,
    position: block.position,
    data: {
      blockMountId: block.blockMountId,
      blockId: block.blockId,
      blockType: block.blockType,
      title: block.title,
      properties: block.properties,
      customProperties: block.customProperties,
      content: block.content, // JSONB content
      pageId: additionalData.pageId,
      orgId: additionalData.orgId,
      workspaceId: additionalData.workspaceId,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
      createdByProfile: block.createdByProfile || {
        userId: 'unknown',
        email: null,
        name: null,
        profileImageUrl: null,
      },
    },
    width: block.size.width,
    height: block.size.height,
    zIndex: block.zOrder,
  };

  // 타입 가드를 통과하면 CustomNodeType으로 취급
  // 실제로는 BaseNodeData 구조이지만, blockType에 따라
  // 런타임에서 올바른 구체 타입으로 동작함
  return node as CustomNodeType;
}

/**
 * CanvasViewData의 edge를 React Flow Edge로 변환
 *
 * ⚠️ Schema Change: edges now use block_mount IDs
 */
export function toReactFlowEdgeFromCanvasView(
  edge: CanvasViewData['edges'][0]
): Edge {
  return {
    id: edge.edgeId,
    source: edge.sourceBlockMountId, // ✅ blockMountId = React Flow node ID
    target: edge.targetBlockMountId, // ✅ blockMountId = React Flow node ID
    sourceHandle: edge.sourceHandle, // ✅ React Flow handle ID
    targetHandle: edge.targetHandle, // ✅ React Flow handle ID
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
