'use client';

import { useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';

import type {
  AlignmentType,
  DistributionDirection,
  Position,
  Size,
} from '@/domains/canvas-management/shared/types/common.types';

import {
  CanvasMetadata,
  useCanvasMetadata,
} from '../contexts/canvas-metadata-context';
import { useCanvasHistory } from '../history';
import { useAlignBlocks } from './block/use-align-blocks';
import { useBlockTransformState } from './block/use-block-transform-state';
import { useDistributeBlocks } from './block/use-distribute-blocks';
import { useUpdateBlockPosition } from './block/use-update-block-position';
import { useUpdateBlockSize } from './block/use-update-block-size';

export interface UseCanvasTransformParams {
  pageId: string;
  canvasMetadataOverride?: CanvasMetadata;
}

export interface UseCanvasTransformResult {
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
    previousSize?: Size; // 히스토리 기록용 이전 크기
  }) => Promise<any>;
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
  isAligning: boolean;
  isDistributing: boolean;
}

/**
 * Canvas Transform 생명주기 관리 Hook (Facade Pattern)
 *
 * - 개별 transform 훅들을 통합하여 단일 API 제공
 * - 프로그램적 제어와 서버 연동을 모두 제공
 * - Optimistic UI 패턴으로 블럭 위치/크기 변경 처리
 * - React Flow Store를 SSOT로 사용
 * - 서버 액션과의 동기화 처리
 */
export function useCanvasTransform(
  params: UseCanvasTransformParams
): UseCanvasTransformResult {
  const canvasMetadata = useCanvasMetadata(params?.canvasMetadataOverride);
  const { pageId } = canvasMetadata;

  // React Flow hooks
  const { getNodes, setNodes, addNodes, deleteElements } = useReactFlow();

  // 타입 안전한 래퍼 함수
  const getNodesTyped = useCallback((): ReturnType<typeof getNodes> => {
    return getNodes();
  }, [getNodes]);

  const reactFlowDependencies = {
    getNodes: getNodesTyped,
    setNodes,
    addNodes,
    deleteElements,
  };

  // ============================================================================
  // 도메인 훅 사용
  // ============================================================================

  // 프로그램적 제어 훅
  const { setBlockPosition, setBlockSize } = useBlockTransformState({
    reactFlow: reactFlowDependencies,
  });

  // 서버 연동 훅
  const { updateBlockPosition: originalUpdateBlockPosition, isUpdating: isUpdatingPosition } =
    useUpdateBlockPosition({
      pageId,
      reactFlow: reactFlowDependencies,
    });

  const { updateBlockSize: originalUpdateBlockSize, isUpdating: isUpdatingSize } = useUpdateBlockSize({
    reactFlow: reactFlowDependencies,
  });

  // Canvas History
  const history = useCanvasHistory();

  const updateBlockPosition = useCallback(
    async (input: {
      blockPositions: Array<{
        blockMountId: string;
        position: Position;
        previousPosition?: Position; // 히스토리 기록용 이전 위치
      }>;
    }) => {
      // 1. 서버 업데이트 실행
      const result = await originalUpdateBlockPosition(input);

      // 2. 히스토리 기록 (Undo/Redo 중에는 건너뜀)
      if (history.getIsSkipping?.()) {
        console.log('[BlockTransform] Skipping history record due to skipping state');
        return result;
      }

      input.blockPositions.forEach((bp) => {
        // 명시적으로 전달된 previousPosition이 있으면 사용, 없으면 현재 노드 위치 찾음
        let finalPrevPos = bp.previousPosition;
        
        if (!finalPrevPos) {
          const node = getNodes().find(n => n.id === bp.blockMountId);
          // 주의: 이 시점의 getNodes()는 이미 이동이 완료된 상태일 수 있음
          finalPrevPos = node ? { ...node.position } : bp.position;
        }

        // 이동이 실제로 일어났는지 확인 (좌표가 같은 경우 기록하지 않음)
        if (finalPrevPos.x === bp.position.x && finalPrevPos.y === bp.position.y) {
          return;
        }

        history.recordOperation({
          type: 'BLOCK_MOVE',
          blockMountId: bp.blockMountId,
          data: {
            previousPosition: finalPrevPos,
            newPosition: bp.position,
          },
        });
      });

      return result;
    },
    [originalUpdateBlockPosition, getNodes, history]
  );

  const updateBlockSize = useCallback(
    async (input: {
      blockMountId: string;
      newSize: Size;
      previousSize?: Size; // 히스토리 기록용 이전 크기
    }) => {
      // 1. 리사이즈 전 크기 백업
      let finalPrevSize = input.previousSize;
      
      // previousSize가 명시적으로 전달되지 않은 경우에만 현재 노드에서 가져옴
      if (!finalPrevSize) {
        const node = getNodes().find(n => n.id === input.blockMountId);
        if (node) {
          // width/height 속성 우선, 없으면 measured 사용
          finalPrevSize = {
            width: node.width ?? node.measured?.width ?? 0,
            height: node.height ?? node.measured?.height ?? 0,
          };
        } else {
          finalPrevSize = { width: 0, height: 0 };
        }
      }

      // 2. 서버 업데이트 실행
      const result = await originalUpdateBlockSize({
        blockMountId: input.blockMountId,
        newSize: input.newSize,
      });

      // 3. 성공 시 히스토리 기록 (Undo/Redo 중에는 건너뜀)
      if (
        result &&
        !history.getIsSkipping?.() &&
        (finalPrevSize.width !== input.newSize.width ||
          finalPrevSize.height !== input.newSize.height)
      ) {
        console.log('[BlockResize] Recording to history:', {
          blockMountId: input.blockMountId,
          previousSize: finalPrevSize,
          newSize: input.newSize,
        });
        
        history.recordOperation({
          type: 'BLOCK_RESIZE',
          blockMountId: input.blockMountId,
          data: {
            previousSize: finalPrevSize,
            newSize: input.newSize,
          },
        });
      }

      return result;
    },
    [originalUpdateBlockSize, getNodes, history]
  );

  // 고급 기능 훅
  const { alignBlocks, isAligning } = useAlignBlocks({
    pageId,
    reactFlow: reactFlowDependencies,
  });

  const { distributeBlocks, isDistributing } = useDistributeBlocks({
    pageId,
    reactFlow: reactFlowDependencies,
  });

  return {
    // 프로그램적 제어
    setBlockPosition,
    setBlockSize,

    // 서버 연동 (blockMountId 사용)
    updateBlockPosition,
    updateBlockSize,
    isUpdatingPosition,
    isUpdatingSize,

    // 고급 기능
    alignBlocks,
    distributeBlocks,
    isAligning,
    isDistributing,
  };
}
