'use client';

import { useCallback } from 'react';

import type { Node } from '@xyflow/react';

import type {
  AlignmentType,
  Position,
} from '@/domains/canvas-management/shared/types/common.types';

import type { ReactFlowDependencies } from './use-update-block-position';
import { useUpdateBlockPosition } from './use-update-block-position';

export type UseAlignBlocksParams = {
  pageId: string;
  reactFlow: ReactFlowDependencies;
};

export type UseAlignBlocksResult = {
  alignBlocks: (
    blockIds: string[],
    alignmentType: AlignmentType
  ) => Promise<void>;
  isAligning: boolean;
};

/**
 * 블럭 정렬 훅
 *
 * - 프론트엔드 계산: 정렬 알고리즘 실행
 * - 서버 저장: TanStack Query 기반 Optimistic Update
 */
export function useAlignBlocks(
  params: UseAlignBlocksParams
): UseAlignBlocksResult {
  const { pageId, reactFlow } = params;
  const { getNodes, setNodes } = reactFlow;

  const { updateBlockPosition, isUpdating } = useUpdateBlockPosition({
    pageId,
    reactFlow,
  });

  const alignBlocks = useCallback(
    async (blockIds: string[], alignmentType: AlignmentType) => {
      try {
        // 1. 선택된 블럭들의 현재 위치 조회
        const nodes = getNodes();
        const selectedNodes = nodes.filter(node => blockIds.includes(node.id));

        if (selectedNodes.length === 0) {
          console.warn('No nodes found for alignment');
          return;
        }

        // 2. 정렬 알고리즘 실행
        let newPositions: Array<{ blockId: string; position: Position }> = [];

        switch (alignmentType) {
          case 'left': {
            // 모든 블럭의 x를 최소 x로 설정
            const minX = Math.min(...selectedNodes.map(n => n.position.x));
            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: { x: minX, y: n.position.y },
            }));
            break;
          }
          case 'right': {
            // 모든 블럭의 x를 최대 x로 설정
            const maxX = Math.max(...selectedNodes.map(n => n.position.x));
            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: { x: maxX, y: n.position.y },
            }));
            break;
          }
          case 'top': {
            // 모든 블럭의 y를 최소 y로 설정
            const minY = Math.min(...selectedNodes.map(n => n.position.y));
            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: { x: n.position.x, y: minY },
            }));
            break;
          }
          case 'bottom': {
            // 모든 블럭의 y를 최대 y로 설정
            const maxY = Math.max(...selectedNodes.map(n => n.position.y));
            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: { x: n.position.x, y: maxY },
            }));
            break;
          }
          case 'center': {
            // 모든 블럭의 중심 x를 평균 중심 x로 설정 (좌우 중앙 정렬)
            const centerX =
              selectedNodes.reduce(
                (sum, n) => sum + n.position.x + (n.width || 0) / 2,
                0
              ) / selectedNodes.length;

            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: {
                x: centerX - (n.width || 0) / 2,
                y: n.position.y,
              },
            }));
            break;
          }
          case 'middle': {
            // 모든 블럭의 중심 y를 평균 중심 y로 설정 (상하 중앙 정렬)
            const centerY =
              selectedNodes.reduce(
                (sum, n) => sum + n.position.y + (n.height || 0) / 2,
                0
              ) / selectedNodes.length;

            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: {
                x: n.position.x,
                y: centerY - (n.height || 0) / 2,
              },
            }));
            break;
          }
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
        console.error('Error aligning blocks:', error);
      }
    },
    [getNodes, setNodes, updateBlockPosition]
  );

  return {
    alignBlocks,
    isAligning: isUpdating,
  };
}
