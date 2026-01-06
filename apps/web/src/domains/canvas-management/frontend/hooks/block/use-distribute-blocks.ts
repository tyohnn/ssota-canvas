'use client';

import { useCallback } from 'react';

import type { Node } from '@xyflow/react';

import type {
  DistributionDirection,
  Position,
} from '@/domains/canvas-management/shared/types/common.types';

import type { ReactFlowDependencies } from './use-update-block-position';
import { useUpdateBlockPosition } from './use-update-block-position';

export type UseDistributeBlocksParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
};

export type UseDistributeBlocksResult = {
  distributeBlocks: (
    blockIds: string[],
    direction: DistributionDirection
  ) => Promise<void>;
  isDistributing: boolean;
};

/**
 * 블럭 균등 분포 훅
 *
 * - 프론트엔드 계산: 분포 알고리즘 실행
 * - 서버 저장: TanStack Query 기반 Optimistic Update
 */
export function useDistributeBlocks(
  params: UseDistributeBlocksParams
): UseDistributeBlocksResult {
  const { pageId, reactFlow } = params;
  const { getNodes, setNodes } = reactFlow;

  const { updateBlockPosition, isUpdating } = useUpdateBlockPosition({
    pageId,
    reactFlow,
  });

  const distributeBlocks = useCallback(
    async (blockIds: string[], direction: DistributionDirection) => {
      try {
        // 1. 선택된 블럭들의 현재 위치 조회
        const nodes = getNodes();
        const selectedNodes = nodes.filter(node => blockIds.includes(node.id));

        if (selectedNodes.length < 2) {
          console.warn('Need at least 2 blocks for distribution');
          return;
        }

        // 2. 분포 알고리즘 실행
        let newPositions: Array<{ blockId: string; position: Position }> = [];

        if (direction === 'horizontal') {
          // 수평 분포: 블럭들을 x축 기준으로 동일 간격 배치
          const sorted = [...selectedNodes].sort(
            (a, b) => a.position.x - b.position.x
          );
          const totalWidth =
            sorted[sorted.length - 1]!.position.x - sorted[0]!.position.x;
          const gap = totalWidth / (sorted.length - 1);

          newPositions = sorted.map((n, i) => ({
            blockId: n.id,
            position: {
              x: sorted[0]!.position.x + gap * i,
              y: n.position.y,
            },
          }));
        } else {
          // 수직 분포: 블럭들을 y축 기준으로 동일 간격 배치
          const sorted = [...selectedNodes].sort(
            (a, b) => a.position.y - b.position.y
          );
          const totalHeight =
            sorted[sorted.length - 1]!.position.y - sorted[0]!.position.y;
          const gap = totalHeight / (sorted.length - 1);

          newPositions = sorted.map((n, i) => ({
            blockId: n.id,
            position: {
              x: n.position.x,
              y: sorted[0]!.position.y + gap * i,
            },
          }));
        }

        // 3. React Flow Store에 즉시 반영
        setNodes(
          (nodes: Node[]) =>
            nodes.map((node: Node) => {
              const newPos = newPositions.find(np => np.blockId === node.id);
              return newPos ? { ...node, position: newPos.position } : node;
            }) as Node[]
        );

        // 4. blockMountId로 변환하여 서버에 저장
        const nodesWithMountId = getNodes();

        const blockMountPositions = newPositions
          .map(bp => {
            const node = nodesWithMountId.find(n => n.id === bp.blockId);
            if (!node || !node.data?.blockMountId) {
              return null;
            }
            return {
              blockMountId: node.data.blockMountId as string,
              position: bp.position,
            };
          })
          .filter(
            (bp): bp is { blockMountId: string; position: Position } =>
              bp !== null
          );

        if (blockMountPositions.length > 0) {
          await updateBlockPosition({ blockPositions: blockMountPositions });
        }
      } catch (error) {
        console.error('Error distributing blocks:', error);
      }
    },
    [getNodes, setNodes, updateBlockPosition]
  );

  return {
    distributeBlocks,
    isDistributing: isUpdating,
  };
}
