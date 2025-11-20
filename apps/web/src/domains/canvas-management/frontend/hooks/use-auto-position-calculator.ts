/**
 * Auto Position Calculator Hook
 *
 * 블럭 생성 시 자동으로 위치를 계산하는 훅
 *
 * 위치 계산 로직:
 * 1. Selected block이 있으면 → 오른쪽이나 아래에 배치
 * 2. Nearby blocks를 고려해서 빈 공간 찾기
 * 3. 기본값: 캔버스 중앙 (0, 0) 또는 viewport 중심
 */

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

const SPACING = 50; // 블럭 간 간격

interface PositionCalculatorResult {
  x: number;
  y: number;
}

export function useAutoPositionCalculator() {
  const { getNodes, screenToFlowPosition } = useReactFlow();

  /**
   * 새 블럭의 위치를 자동으로 계산
   */
  const calculatePosition = useCallback(
    (
      blockType: string,
      selectedBlockIds?: string[]
    ): PositionCalculatorResult => {
      const allNodes = getNodes();

      // 1. Selected block이 있으면 그 옆에 배치
      if (selectedBlockIds && selectedBlockIds.length > 0) {
        const selectedNode = allNodes.find(node =>
          selectedBlockIds.includes(node.id)
        );

        if (selectedNode) {
          // 선택된 블럭의 오른쪽에 배치
          return {
            x: selectedNode.position.x + (selectedNode.width || 300) + SPACING,
            y: selectedNode.position.y,
          };
        }
      }

      // 2. 블럭이 있으면 마지막 블럭의 오른쪽에 배치
      if (allNodes.length > 0) {
        // 가장 오른쪽에 있는 블럭 찾기
        const rightmostNode = allNodes.reduce((prev, current) => {
          const prevX = prev.position.x + (prev.width || 300);
          const currentX = current.position.x + (current.width || 300);
          return currentX > prevX ? current : prev;
        });

        // 오른쪽에 배치
        return {
          x: rightmostNode.position.x + (rightmostNode.width || 300) + SPACING,
          y: rightmostNode.position.y,
        };
      }

      // 3. 블럭이 없으면 viewport 중심에 배치
      try {
        // Viewport의 중심 좌표를 flow 좌표로 변환
        const viewportCenter = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });

        return {
          x: viewportCenter.x - 150, // 블럭 중심을 맞추기 위해 절반 빼기
          y: viewportCenter.y - 100,
        };
      } catch (error) {
        // screenToFlowPosition 실패 시 기본값
        return { x: 0, y: 0 };
      }
    },
    [getNodes, screenToFlowPosition]
  );

  return { calculatePosition };
}
