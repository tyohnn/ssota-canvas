import type { BuiltInEdge, BuiltInNode, Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

import {
  BaseNodeData,
  BlockNodeData,
} from '@/domains/block-management/shared/types/block-data.types';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';

import type {
  BlockMountView,
  CanvasViewData,
  EdgeView,
  TransformBlockDTO,
} from '../../shared/dtos';
import type { BlockView } from '../../shared/dtos/views/block.views';

/**
 * Custom Node Type (자동 생성)
 *
 * BlockNodeData 유니온 타입에서 자동으로 생성됨
 * 새로운 블록 타입 추가 시 block-data.types.ts에만 추가하면 자동 반영
 */
export type CustomNodeType = BuiltInNode | Node<BlockNodeData, BlockType>;

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
  blockMountId: string
): BaseNodeData {
  return {
    blockMountId,
    blockId: blockView.blockId,
    blockType: blockView.blockType,
    title: blockView.title,
    properties: cleanNestedProperties(blockView.properties),
    customProperties: blockView.customProperties,
    content: blockView.content, // JSONB content
    viewMode: blockView.viewMode, // BlockMount의 viewMode
    sizes: blockView.viewModeSizes, // 뷰 모드별 크기 정보 (GroupBlock 등에서 사용)
    size: blockView.size, // 현재 크기 (TextBlock, ShapeBlock 등에서 사용, 레거시)
    parentBlockMountId: blockView.parentBlockMountId,
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

  const data = transformBlockViewToNodeData(block, blockMount.blockMountId);
  return {
    id: blockMount.blockMountId, // React Flow node ID
    type: block.blockType, // 노드 타입 (커스텀 컴포넌트)
    position: blockMount.position,
    data,
    width: blockMount.size.width,
    height: blockMount.size.height,
    zIndex: blockMount.zOrder,
    parentId: blockMount.parentBlockMountId ?? undefined, // React Flow parentId (extent 없음)
  };
}

/**
 * EdgeView를 React Flow Edge로 변환
 *
 * ⚠️ Schema Change: edges now use block_mount IDs (React Flow node IDs)
 * markerStart = path 시작 = source, markerEnd = path 끝 = target
 */
export function toReactFlowEdge(edge: EdgeView): Edge {
  const strokeColor = edge.style?.stroke ?? '#9ca3af';
  // Migration 이후 기존 row는 marker_end='arrow', marker_start=NULL. 방어적으로 null/undefined 처리.
  const markerEnd = edge.markerEnd ?? 'arrow';
  const markerStart = edge.markerStart ?? null;

  // Convert marker type to React Flow format
  const convertMarker = (markerType: string | null | undefined) => {
    if (!markerType || markerType === 'none') return undefined;

    return {
      type: MarkerType.ArrowClosed, // React Flow default, we override with custom markers
      width: 20,
      height: 20,
      color: strokeColor,
      // Store the actual marker type for our custom renderer
      markerType,
    };
  };

  return {
    id: edge.edgeId,
    source: edge.sourceBlockMountId, // ✅ blockMountId = React Flow node ID
    target: edge.targetBlockMountId, // ✅ blockMountId = React Flow node ID
    sourceHandle: edge.sourceHandle, // ✅ React Flow handle ID
    targetHandle: edge.targetHandle, // ✅ React Flow handle ID
    type: 'custom', // 항상 custom 타입 사용 (CustomEdge 컴포넌트 사용)
    label: edge.label,
    style: edge.style,
    markerEnd: convertMarker(markerEnd),
    markerStart: convertMarker(markerStart),
    data: {
      edgeId: edge.edgeId,
      actualEdgeShape: edge.edgeShape || 'default', // 실제 엣지 모양 저장
      pageId: edge.pageId,
      createdAt: edge.createdAt,
      updatedAt: edge.updatedAt,
      // Store marker types for custom rendering
      markerEndType: markerEnd,
      markerStartType: markerStart,
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
    parentBlockMountId: node.parentId,
  };
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
      'group',
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
  block: CanvasViewData['blocks'][0]
): CustomNodeType {
  const data = transformBlockViewToNodeData(block, block.blockMountId);
  const node: Node<BaseNodeData> = {
    id: block.blockMountId,
    type: block.blockType,
    position: block.position,
    data,
    width: block.size.width,
    height: block.size.height,
    zIndex: block.zOrder,
    parentId: block.parentBlockMountId, // React Flow parentId (extent 없음 - 자유 이동)
  };

  // 타입 가드를 통과하면 CustomNodeType으로 취급
  // 실제로는 BaseNodeData 구조이지만, blockType에 따라
  // 런타임에서 올바른 구체 타입으로 동작함
  return node as CustomNodeType;
}

/**
 * React Flow 노드 배열을 정렬 (부모 노드가 자식보다 먼저 오도록)
 * 
 * React Flow에서 parentId가 있는 노드는 해당 부모 노드가 배열에서 먼저 와야
 * 올바르게 상대 좌표로 렌더링됩니다.
 * 
 * 그룹 노드는 항상 최상위에 배치하여 어떤 그룹으로 이동하든 부모가 자식보다 앞에 있도록 보장합니다.
 */
export function sortNodesForReactFlow<T extends { id: string; parentId?: string | null; type?: string }>(
  nodes: T[]
): T[] {
  // 1. 그룹 노드들: 부모가 자식보다 먼저 오도록 정렬 (중첩 그룹 대비)
  const groupNodesRaw = nodes.filter(n => n.type === 'group');
  const groupIds = new Set(groupNodesRaw.map(n => n.id));
  const groupNodes: T[] = [];
  const groupProcessed = new Set<string>();
  function addGroupWithChildren(node: T) {
    if (groupProcessed.has(node.id)) return;
    const parentId = node.parentId ?? null;
    if (parentId != null && groupIds.has(parentId)) {
      const parent = groupNodesRaw.find(n => n.id === parentId);
      if (parent) addGroupWithChildren(parent);
    }
    if (groupProcessed.has(node.id)) return;
    groupProcessed.add(node.id);
    groupNodes.push(node);
  }
  // 그룹 노드들도 부모-자식 순서로 정렬 (중첩 그룹 시 자식 그룹이 부모보다 앞에 오면 React Flow 깨짐)
  groupNodesRaw.forEach(addGroupWithChildren);

  // 2. 그룹이 아닌 노드들
  const nonGroupNodes = nodes.filter(n => n.type !== 'group');

  // 3. 비그룹 노드들을 부모-자식 순서로 정렬
  const rootNodes = nonGroupNodes.filter(n => !n.parentId);
  const childNodes = nonGroupNodes.filter(n => n.parentId);

  const result: T[] = [];
  const processed = new Set<string>();

  function addNodeWithChildren(node: T) {
    if (processed.has(node.id)) return;
    processed.add(node.id);
    result.push(node);

    const children = childNodes.filter(c => c.parentId === node.id);
    children.forEach(child => addNodeWithChildren(child));
  }

  rootNodes.forEach(rootNode => addNodeWithChildren(rootNode));

  nonGroupNodes.forEach(n => {
    if (!processed.has(n.id)) {
      result.push(n);
    }
  });

  return [...groupNodes, ...result];
}

/**
 * CanvasViewData의 edge를 React Flow Edge로 변환
 *
 * ⚠️ Schema Change: edges now use block_mount IDs
 */
export function toReactFlowEdgeFromCanvasView(
  edge: CanvasViewData['edges'][0]
): Edge {
  const strokeColor = edge.style?.stroke ?? '#9ca3af';
  const markerEnd = edge.markerEnd ?? 'arrow';
  const markerStart = edge.markerStart ?? null;

  // Convert marker type to React Flow format
  const convertMarker = (markerType: string | null | undefined) => {
    if (!markerType || markerType === 'none') return undefined;

    return {
      type: MarkerType.ArrowClosed, // React Flow default, we override with custom markers
      width: 20,
      height: 20,
      color: strokeColor,
      // Store the actual marker type for our custom renderer
      markerType,
    };
  };

  return {
    id: edge.edgeId,
    source: edge.sourceBlockMountId, // ✅ blockMountId = React Flow node ID
    target: edge.targetBlockMountId, // ✅ blockMountId = React Flow node ID
    sourceHandle: edge.sourceHandle, // ✅ React Flow handle ID
    targetHandle: edge.targetHandle, // ✅ React Flow handle ID
    type: 'custom', // 항상 custom 타입 사용 (CustomEdge 컴포넌트 사용)
    label: edge.label,
    style: edge.style,
    markerEnd: convertMarker(markerEnd),
    markerStart: convertMarker(markerStart),
    data: {
      edgeId: edge.edgeId,
      actualEdgeShape: edge.edgeShape || 'default', // 실제 엣지 모양 저장
      pageId: edge.pageId,
      // Store marker types for custom rendering
      markerEndType: markerEnd,
      markerStartType: markerStart,
    },
  };
}
