/**
 * Position Calculator
 *
 * Source 블록 기준으로 Visual Summary 시작 위치를 계산하는 유틸
 *
 * 배치 전략:
 * 1. Source 블록의 오른쪽에 배치 (기본)
 * 2. 오른쪽에 공간이 부족하면 아래쪽에 배치
 * 3. 기존 노드와 충돌 시 자동으로 오프셋 조정
 */

import type { Node } from '@xyflow/react';

export interface CalculateStartPositionParams {
  sourceBlockPosition: { x: number; y: number };
  sourceBlockSize: { width: number; height: number };
  existingNodes: Node[];
  sourceBlockId?: string; // Source 블록 ID (충돌 체크 시 제외용)
  /** When set, skip collision check and return right or below position only. */
  forceDirection?: 'right' | 'below';
}

const SPACING = 100;

export function calculateStartPosition(
  params: CalculateStartPositionParams
): { x: number; y: number } {
  const {
    sourceBlockPosition,
    sourceBlockSize,
    existingNodes,
    sourceBlockId,
    forceDirection,
  } = params;

  const rightPosition = {
    x: sourceBlockPosition.x + sourceBlockSize.width + SPACING,
    y: sourceBlockPosition.y,
  };

  const bottomPosition = {
    x: sourceBlockPosition.x,
    y: sourceBlockPosition.y + sourceBlockSize.height + SPACING,
  };

  if (forceDirection === 'right') return rightPosition;
  if (forceDirection === 'below') return bottomPosition;

  const hasRightCollision = existingNodes.some((node) => {
    if (sourceBlockId && node.id === sourceBlockId) return false;
    const nodeRight = node.position.x + (node.width || 300);
    const nodeLeft = node.position.x;
    const checkRight = rightPosition.x;
    return checkRight < nodeRight && checkRight > nodeLeft - SPACING;
  });

  if (!hasRightCollision) return rightPosition;

  const hasBottomCollision = existingNodes.some((node) => {
    if (sourceBlockId && node.id === sourceBlockId) return false;
    const nodeBottom = node.position.y + (node.height || 200);
    const nodeTop = node.position.y;
    const checkBottom = bottomPosition.y;
    return checkBottom < nodeBottom && checkBottom > nodeTop - SPACING;
  });

  if (!hasBottomCollision) return bottomPosition;

  return {
    x: sourceBlockPosition.x + sourceBlockSize.width + SPACING,
    y: sourceBlockPosition.y + sourceBlockSize.height + SPACING,
  };
}
