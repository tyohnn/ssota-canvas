'use client';

import { useCallback } from 'react';

import type { Node } from '@xyflow/react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type {
  AlignmentType,
  DistributionDirection,
  Position,
  Size,
} from '@/domains/canvas-management/shared/types/common.types';

import type { ReactFlowDependencies } from './use-update-block-position';
import { useUpdateBlockPosition } from './use-update-block-position';
import { useUpdateBlockSize } from './use-update-block-size';

export type UseBlockTransformOperationsParams = {
  reactFlow: ReactFlowDependencies;
};

export type UseBlockTransformOperationsResult = {
  // 프로그램적 제어 (UI만 변경, 서버 호출 X)
  setBlockPosition: (blockId: string, position: Position) => void;
  setBlockSize: (blockId: string, size: Size) => void;
  // 서버 연동 (영구 저장) - blockMountId 사용
  updateBlockPosition: (input: {
    blockPositions: Array<{
      blockMountId: string;
      position: Position;
    }>;
  }) => Promise<any>;
  updateBlockSize: (input: {
    blockMountId: string;
    newSize: Size;
  }) => Promise<any>;
  // 서버 연동 (영구 저장) - blockId 사용 (기존 코드 호환성)
  saveBlockPositions: (
    blockPositions:
      | Array<{ blockId: string; position: Position }>
      | { blockId: string; position: Position }
  ) => Promise<any>;
  saveBlockSize: (blockId: string, size: Size) => Promise<void>;
  isUpdatingPosition: boolean;
  isUpdatingSize: boolean;
  // 고급 기능 (프론트엔드 계산 + 서버 저장)
  alignBlocks: (
    blockIds: string[],
    alignmentType: AlignmentType
  ) => Promise<void>;
  distributeBlocks: (
    blockIds: string[],
    direction: DistributionDirection
  ) => Promise<void>;
};

/**
 * 블록 변형 작업 통합 훅
 *
 * - 프로그램적 제어: React Flow Store 직접 업데이트 (서버 호출 X)
 * - 서버 연동: TanStack Query 기반 Optimistic Update
 * - 고급 기능: 정렬, 분포 (프론트엔드 계산 + 서버 저장)
 */
export function useBlockTransformOperations(
  params: UseBlockTransformOperationsParams
): UseBlockTransformOperationsResult {
  const { reactFlow } = params;
  const { getNodes, setNodes } = reactFlow;

  // 서버 연동 훅 사용
  const { updateBlockPosition, isUpdating: isUpdatingPosition } =
    useUpdateBlockPosition({
      reactFlow,
    });

  const { updateBlockSize, isUpdating: isUpdatingSize } = useUpdateBlockSize({
    reactFlow,
  });

  /**
   * 프로그램적 제어: React Flow Store 직접 업데이트 (서버 호출 X)
   */
  const setBlockPosition = useCallback(
    (blockId: string, position: Position) => {
      setNodes(
        (nodes: Node[]) =>
          nodes.map((node: Node) =>
            node.id === blockId ? { ...node, position } : node
          ) as Node[]
      );
    },
    [setNodes]
  );

  const setBlockSize = useCallback(
    (blockId: string, size: Size) => {
      setNodes(
        (nodes: Node[]) =>
          nodes.map((node: Node) =>
            node.id === blockId
              ? {
                  ...node,
                  data: { ...node.data, size },
                  width: size.width,
                  height: size.height,
                }
              : node
          ) as Node[]
      );
    },
    [setNodes]
  );

  /**
   * 블럭 정렬: 프론트엔드 계산 + 서버 저장
   */
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

  /**
   * 블럭 균등 분포: 프론트엔드 계산 + 서버 저장
   */
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
        const firstNode = nodesWithMountId.find(
          n => n.id === newPositions[0]?.blockId
        );
        const pageId =
          (firstNode?.data as BlockNodeData | undefined)?.pageId || '';

        if (!pageId) {
          console.warn('Page ID not found for distribution');
          return;
        }

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

  /**
   * 서버 연동 (영구 저장) - blockId 사용 (기존 코드 호환성)
   * blockId를 blockMountId로 변환하여 updateBlockPosition 호출
   */
  const saveBlockPositions = useCallback(
    async (
      blockPositions:
        | Array<{ blockId: string; position: Position }>
        | { blockId: string; position: Position }
    ) => {
      try {
        // 단일 위치인 경우 배열로 변환
        const positionsArray = Array.isArray(blockPositions)
          ? blockPositions
          : [blockPositions];

        // blockId를 blockMountId로 변환
        const nodes = getNodes();
        const firstNode = nodes.find(n => n.id === positionsArray[0]?.blockId);
        const pageId =
          (firstNode?.data as BlockNodeData | undefined)?.pageId || '';

        if (!pageId) {
          throw new Error('Page ID not found');
        }

        const blockMountPositions = positionsArray
          .map(bp => {
            const node = nodes.find(n => n.id === bp.blockId);
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
        console.error('Error saving block positions:', error);
        throw error;
      }
    },
    [getNodes, updateBlockPosition]
  );

  const saveBlockSize = useCallback(
    async (blockId: string, size: Size) => {
      try {
        // blockId를 blockMountId로 변환
        const nodes = getNodes();
        const node = nodes.find(n => n.id === blockId);

        if (!node || !node.data?.blockMountId) {
          console.error('Block mount ID not found for block:', blockId);
          return;
        }

        const blockMountId = node.data.blockMountId as string;
        await updateBlockSize({ blockMountId, newSize: size });
      } catch (error) {
        console.error('Error saving block size:', error);
      }
    },
    [getNodes, updateBlockSize]
  );

  return {
    // 프로그램적 제어
    setBlockPosition,
    setBlockSize,
    // 서버 연동 (blockMountId 사용)
    updateBlockPosition,
    updateBlockSize,
    // 서버 연동 (blockId 사용 - 기존 코드 호환성)
    saveBlockPositions,
    saveBlockSize,
    isUpdatingPosition,
    isUpdatingSize,
    // 고급 기능
    alignBlocks,
    distributeBlocks,
  };
}
