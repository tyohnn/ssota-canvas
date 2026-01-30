/**
 * Position Adjuster Utility
 * 
 * Canvasdown 노드의 위치를 조정하는 유틸리티 함수들
 * Source block 기준 시작 위치와 Canvasdown 노드의 첫 번째 노드 위치를 비교하여 오프셋을 계산합니다.
 */

import type { Node } from '@xyflow/react';

export interface Position {
  x: number;
  y: number;
}

export interface CalculateOffsetParams {
  startPosition: Position;
  nodes: Node[];
}

/**
 * 첫 번째 루트 노드를 기준으로 오프셋을 계산합니다.
 * 
 * @param params - 시작 위치와 노드 배열
 * @returns 오프셋 (x, y)
 */
export function calculateOffset(params: CalculateOffsetParams): Position {
  const { startPosition, nodes } = params;

  // 부모 노드(zone)가 없는 루트 노드 중 첫 번째를 기준으로 계산
  const rootNodes = nodes.filter(n => !n.parentId);
  const firstNode = rootNodes[0] || nodes[0];

  if (!firstNode) {
    // 노드가 없으면 시작 위치를 그대로 반환
    return { x: startPosition.x, y: startPosition.y };
  }

  return {
    x: startPosition.x - firstNode.position.x,
    y: startPosition.y - firstNode.position.y,
  };
}

/**
 * 노드의 위치에 오프셋을 적용합니다.
 * 
 * @param position - 원본 위치
 * @param offset - 적용할 오프셋
 * @returns 조정된 위치
 */
export function adjustPosition(
  position: Position,
  offset: Position
): Position {
  return {
    x: position.x + offset.x,
    y: position.y + offset.y,
  };
}

/**
 * 노드 배열의 모든 위치를 조정합니다.
 * 
 * @param nodes - 조정할 노드 배열
 * @param offset - 적용할 오프셋
 * @returns 조정된 위치를 가진 노드 배열 (새 배열 반환)
 */
export function adjustNodePositions(
  nodes: Node[],
  offset: Position
): Node[] {
  return nodes.map(node => ({
    ...node,
    position: adjustPosition(node.position, offset),
  }));
}
