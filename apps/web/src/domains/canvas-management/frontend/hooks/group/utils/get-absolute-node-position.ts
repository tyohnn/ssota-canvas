import type { Node } from '@xyflow/react';

/**
 * 노드의 절대 좌표를 계산 (부모 체인을 따라 재귀적으로)
 * parentId가 있으면 position은 부모 기준 상대 좌표이므로, 절대 좌표로 변환 필요
 */
export function getAbsoluteNodePosition(
  node: Node,
  allNodes: Node[]
): { x: number; y: number } {
  if (!node.parentId) {
    return node.position;
  }

  const parent = allNodes.find(n => n.id === node.parentId);
  if (!parent) {
    return node.position;
  }

  const parentAbsPos = getAbsoluteNodePosition(parent, allNodes);
  return {
    x: parentAbsPos.x + node.position.x,
    y: parentAbsPos.y + node.position.y,
  };
}
