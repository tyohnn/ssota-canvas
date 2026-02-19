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

/** Canvasdown 노드 타입별 기본 크기 (겹침 판정용) */
const DEFAULT_NODE_SIZE: Record<string, { width: number; height: number }> = {
  group: { width: 500, height: 400 },
  zone: { width: 500, height: 400 },
  markdown: { width: 342, height: 456 },
  shape: { width: 154, height: 70 },
};

const FALLBACK_SIZE = { width: 300, height: 200 };
const ROOT_SPACING = 24;

function getNodeSize(node: Node): { width: number; height: number } {
  const w = (node.width as number) ?? (node.measured?.width as number);
  const h = (node.height as number) ?? (node.measured?.height as number);
  if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
    return { width: w, height: h };
  }
  const type = (node.type as string) ?? '';
  return DEFAULT_NODE_SIZE[type] ?? FALLBACK_SIZE;
}

function overlaps(
  a: Position,
  aSize: { width: number; height: number },
  b: Position,
  bSize: { width: number; height: number }
): boolean {
  return !(
    a.x + aSize.width + ROOT_SPACING <= b.x ||
    b.x + bSize.width + ROOT_SPACING <= a.x ||
    a.y + aSize.height + ROOT_SPACING <= b.y ||
    b.y + bSize.height + ROOT_SPACING <= a.y
  );
}

/**
 * 루트 노드들에 오프셋을 적용한 뒤 겹치지 않도록 위치를 재배치합니다.
 * 첫 노드는 startPosition에 두고, 겹치는 노드는 아래로 쌓습니다.
 *
 * @param rootNodes - 부모가 없는 노드만 (parentId 없음)
 * @param startPosition - 전체 배치 시작 위치
 * @param offset - 파서 좌표 → 캔버스 좌표 오프셋
 * @returns nodeId → 최종 위치 맵
 */
export function computeNonOverlappingRootPositions(
  rootNodes: Node[],
  startPosition: Position,
  offset: Position
): Map<string, Position> {
  const result = new Map<string, Position>();
  if (rootNodes.length === 0) return result;

  const sorted = [...rootNodes].sort((a, b) => {
    const ay = a.position?.y ?? 0;
    const by = b.position?.y ?? 0;
    if (ay !== by) return ay - by;
    return (a.position?.x ?? 0) - (b.position?.x ?? 0);
  });

  const placed: Array<{ position: Position; size: { width: number; height: number } }> = [];

  for (const node of sorted) {
    const size = getNodeSize(node);
    let pos = adjustPosition(node.position, offset);
    if (placed.length === 0) {
      pos = { x: startPosition.x, y: startPosition.y };
    } else {
      for (;;) {
        let overlapBottom: number | null = null;
        for (const p of placed) {
          if (overlaps(pos, size, p.position, p.size)) {
            const bottom = p.position.y + p.size.height + ROOT_SPACING;
            if (overlapBottom == null || bottom > overlapBottom) overlapBottom = bottom;
          }
        }
        if (overlapBottom == null) break;
        pos = { x: pos.x, y: overlapBottom };
      }
    }
    result.set(node.id, pos);
    placed.push({ position: pos, size });
  }

  return result;
}
