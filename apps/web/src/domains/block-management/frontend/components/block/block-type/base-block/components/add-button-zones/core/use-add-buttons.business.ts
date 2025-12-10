/**
 * Add Buttons Business Logic Hook
 *
 * 블록 추가 비즈니스 로직
 */

'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useBaseBlockContext } from '../../../core/use-base-block.context';
import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import type { HoverDirection } from './types';

// 블록 생성 간격 (상수) - 경계에서 100px 떨어진 위치
const BLOCK_ADD_GAP_PX = 100;

export type AddButtonDirection = Exclude<HoverDirection, null>;

export interface UseAddButtonsBusinessReturn {
  handleAddBlock: (direction: AddButtonDirection) => Promise<void>;
}

/**
 * Add Buttons Business Logic Hook
 *
 * 블록 추가 비즈니스 로직만 담당
 */
export function useAddButtonsBusiness(): UseAddButtonsBusinessReturn {
  const { data, width, height } = useBaseBlockContext();
  const { getNode } = useReactFlow();

  const blockLifecycle = useCanvasBlockLifecycle({
    pageId: data.pageId,
    orgId: data.orgId,
    workspaceId: data.workspaceId,
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

      // 3. 방향에 맞는 위치 계산 (경계 기준 +100px)
      let newPosition: { x: number; y: number };
      switch (direction) {
        case 'top':
          // 위쪽: x는 같고, 상단 경계에서 -100px
          newPosition = {
            x: currentNode.position.x,
            y: currentNode.position.y - blockHeight - BLOCK_ADD_GAP_PX,
          };
          break;
        case 'bottom':
          // 아래쪽: x는 같고, 하단 경계에서 +100px
          newPosition = {
            x: currentNode.position.x,
            y: currentNode.position.y + blockHeight + BLOCK_ADD_GAP_PX,
          };
          break;
        case 'left':
          // 왼쪽: y는 같고, 좌측 경계에서 -100px
          newPosition = {
            x: currentNode.position.x - blockWidth - BLOCK_ADD_GAP_PX,
            y: currentNode.position.y,
          };
          break;
        case 'right':
          // 오른쪽: y는 같고, 우측 경계에서 +100px
          newPosition = {
            x: currentNode.position.x + blockWidth + BLOCK_ADD_GAP_PX,
            y: currentNode.position.y,
          };
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
    [data, width, height, getNode, blockLifecycle]
  );

  return {
    handleAddBlock,
  };
}
