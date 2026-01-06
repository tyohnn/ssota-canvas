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
  const { updateBlockPosition, isUpdating: isUpdatingPosition } =
    useUpdateBlockPosition({
      pageId,
      reactFlow: reactFlowDependencies,
    });

  const { updateBlockSize, isUpdating: isUpdatingSize } = useUpdateBlockSize({
    reactFlow: reactFlowDependencies,
  });

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
