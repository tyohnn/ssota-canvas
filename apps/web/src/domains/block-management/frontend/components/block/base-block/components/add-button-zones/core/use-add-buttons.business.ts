/**
 * Add Buttons Business Logic Hook
 *
 * 블록 추가 비즈니스 로직
 */

'use client';

import { useCallback } from 'react';
import type { Node } from '@xyflow/react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';

import type { HoverDirection } from './types';

// 블록 생성 간격 (상수) - 경계에서 50px 떨어진 위치
const BLOCK_ADD_GAP_PX = 50;

/**
 * 부모 체인을 따라 캔버스(절대) 좌표 계산.
 * 그룹 안의 노드는 position이 부모 기준 상대 좌표이므로, createAndMountBlock에
 * 절대 좌표를 넘기기 위해 사용.
 */
function getAbsolutePosition(node: Node, getNode: (id: string) => Node | undefined): { x: number; y: number } {
  if (!node.parentId) return node.position;
  const parent = getNode(node.parentId);
  if (!parent) return node.position;
  const p = getAbsolutePosition(parent, getNode);
  return { x: p.x + node.position.x, y: p.y + node.position.y };
}

export type AddButtonDirection = Exclude<HoverDirection, null>;

/**
 * React Flow 의존성 인터페이스
 */
export interface ReactFlowDependencies {
  getNode: (id: string) => Node | undefined;
}

export interface UseAddButtonsBusinessOptions {
  data: BlockNodeData;
  width?: number;
  height?: number;
  reactFlow: ReactFlowDependencies;
}

export interface UseAddButtonsBusinessReturn {
  handleAddBlock: (direction: AddButtonDirection) => Promise<void>;
}

/**
 * Add Buttons Business Logic Hook
 *
 * 블록 추가 비즈니스 로직만 담당
 * - 의존성 주입 패턴으로 테스트 가능성 향상
 */
export function useAddButtonsBusiness(
  options: UseAddButtonsBusinessOptions
): UseAddButtonsBusinessReturn {
  const { data, width, height, reactFlow } = options;
  const { getNode } = reactFlow;
  
  const canvasMetadata = useCanvasMetadata();
  const { pageId } = canvasMetadata;

  const blockLifecycle = useCanvasBlockLifecycle({
    pageId,
  });

  const handleAddBlock = useCallback(
    async (direction: AddButtonDirection) => {
      const blockMountId = data.blockMountId || '';
      if (!blockMountId) {
        console.error('Block mount ID not found');
        return;
      }

      // 1. 현재 노드 위치 가져오기
      const currentNode = getNode(blockMountId);
      if (!currentNode) {
        console.error('Current node not found:', blockMountId);
        return;
      }

      // 2. 블록 크기 (기본값 설정)
      const blockWidth = width || currentNode.width || 200;
      const blockHeight = height || currentNode.height || 150;

      // 2.5. 캔버스 절대 좌표 (그룹 안의 노드는 상대 좌표이므로 변환)
      const base = getAbsolutePosition(currentNode, getNode);

      // 3. 방향에 맞는 위치 계산 (경계 기준 +GAP). 새 블록은 항상 루트(그룹 밖)에 생성.
      let newPosition: { x: number; y: number };
      switch (direction) {
        case 'top':
          newPosition = { x: base.x, y: base.y - blockHeight - BLOCK_ADD_GAP_PX };
          break;
        case 'bottom':
          newPosition = { x: base.x, y: base.y + blockHeight + BLOCK_ADD_GAP_PX };
          break;
        case 'left':
          newPosition = { x: base.x - blockWidth - BLOCK_ADD_GAP_PX, y: base.y };
          break;
        case 'right':
          newPosition = { x: base.x + blockWidth + BLOCK_ADD_GAP_PX, y: base.y };
          break;
      }

      // 4. 동일한 블록 타입으로 새 블록 생성 (기본값 사용)
      // - properties: 복제하지 않음 → 블록 타입의 기본값 사용
      // - title: 복제하지 않음 → 기본값 사용
      // - customProperties: 복제하지 않음 → 기본값 사용
      await blockLifecycle.createAndMountBlock(
        data.blockType,
        newPosition,
        undefined, // properties는 복제하지 않음 (기본값 사용)
        undefined, // content는 복사하지 않음 (초기화)
        undefined // title도 복제하지 않음 (기본값 사용)
      );
    },
    [data, width, height, reactFlow, blockLifecycle]
  );

  return {
    handleAddBlock,
  };
}
