'use client';

import { useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

import type {
  BlockCreatedAndMountedDTO,
  BlockDuplicatedAndMountedDTO,
} from '../../shared/dtos/responses';
import type { Position } from '../../shared/types/common.types';
import { useCanvasMode } from '../contexts/canvas-mode-context';
import { useBlockCanvasOperations } from './block/use-block-canvas-operations';
import { useCreateBlock } from './block/use-create-block';
import { useDuplicateBlock } from './block/use-duplicate-block';
import { useDuplicateBlocks } from './block/use-duplicate-blocks';
import { useMoveBlockToPage } from './block/use-move-block-to-page';
import { useSoftDeleteBlock } from './block/use-soft-delete-block';

export interface UseCanvasBlockLifecycleParams {
  pageId: string;
}

export interface UseCanvasBlockLifecycleResult {
  // Optimistic UI 제어 (사용자 액션, AI Tool Call)
  createAndMountBlock: (
    blockType: BlockType,
    position: Position,
    initialProperties?: Record<string, any>, // 선택적 초기 properties
    initialContent?: unknown, // 선택적 초기 content (JSONB)
    title?: string // 선택적 초기 title
  ) => Promise<BlockCreatedAndMountedDTO | void>;
  softDeleteBlockMounts: (blockMountIds: string | string[]) => Promise<void>;
  duplicateBlockAndMount: (
    blockMountId: string,
    offsetX?: number,
    offsetY?: number
  ) => Promise<void>;
  duplicateMultipleBlocksAndMount: (
    blocks: Array<{
      blockMountId: string;
      offsetX?: number;
      offsetY?: number;
    }>
  ) => Promise<void>;
  moveBlockToPage: (
    blockMountId: string,
    targetPageId: string
  ) => Promise<void>;

  // 프로그램적 제어 (UI만 변경, 서버 호출 X)
  addBlockToCanvas: (
    blockId: string,
    nodeData: BlockNodeData,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ) => void;
  removeBlockFromCanvas: (blockId: string) => void;

  // 상태 읽기
  getAllBlocks: () => any[];
  getBlockById: (blockId: string) => any | undefined;
  getBlockCount: () => number;
}

/**
 * Block 생명주기 관리 Hook (Facade Pattern)
 *
 * - 개별 mutation 훅들을 통합하여 단일 API 제공
 * - 기존 API 유지 (Breaking Change 없음)
 * - Optimistic UI 패턴으로 블럭 생성/삭제 처리
 * - React Flow Store를 SSOT로 사용
 * - 서버 액션과의 동기화 처리
 */
export function useCanvasBlockLifecycle(
  params: UseCanvasBlockLifecycleParams
): UseCanvasBlockLifecycleResult {
  const { pageId } = params;

  // React Flow hooks
  const { addNodes, deleteElements, getNodes, setNodes } = useReactFlow();

  // Canvas Mode hook
  const canvasMode = useCanvasMode();
  const {
    enterSingleSelectionMode,
    enterMultiSelectionMode,
    enterBlockEditingMode,
    exitToDefaultMode,
  } = canvasMode;

  // 타입 안전한 래퍼 함수
  const getNodesTyped = useCallback((): ReturnType<typeof getNodes> => {
    return getNodes();
  }, [getNodes]);

  // ============================================================================
  // 도메인 훅 사용
  // ============================================================================

  const { createBlock, isCreating } = useCreateBlock({
    pageId,
    reactFlow: {
      getNodes: getNodesTyped,
      setNodes,
      addNodes,
      deleteElements,
    },
    onSuccess: block => {
      // 단일 선택 모드로 전환
      enterSingleSelectionMode(block.blockMountId);
      // 자동으로 에디터 패널 열기
      enterBlockEditingMode(block.blockId);
    },
    onError: () => {
      exitToDefaultMode();
    },
  });

  const { softDeleteBlock, isDeleting } = useSoftDeleteBlock({
    reactFlow: {
      getNodes: getNodesTyped,
      setNodes,
      addNodes,
      deleteElements,
    },
    onSuccess: () => {
      exitToDefaultMode();
    },
  });

  const { duplicateBlock, isDuplicating: isDuplicatingSingle } =
    useDuplicateBlock({
      reactFlow: {
        getNodes: getNodesTyped,
        setNodes,
        addNodes,
        deleteElements,
      },
      onSuccess: block => {
        // 단일 선택 모드로 전환 (이미 훅 내부에서 처리됨)
      },
      onError: () => {
        exitToDefaultMode();
      },
    });

  const { duplicateBlocks, isDuplicating: isDuplicatingMultiple } =
    useDuplicateBlocks({
      reactFlow: {
        getNodes: getNodesTyped,
        setNodes,
        addNodes,
        deleteElements,
      },
      onSuccess: blockMountIds => {
        // 멀티 선택 모드로 전환 (이미 훅 내부에서 처리됨)
        enterMultiSelectionMode(blockMountIds);
      },
      onError: () => {
        exitToDefaultMode();
      },
    });

  const { moveBlockToPage: moveBlockToPageHook, isMoving } = useMoveBlockToPage(
    {
      reactFlow: {
        getNodes: getNodesTyped,
        setNodes,
        addNodes,
      },
      onExit: exitToDefaultMode,
    }
  );

  // ============================================================================
  // 프로그램적 제어 & 상태 읽기
  // ============================================================================

  const {
    addBlockToCanvas: addBlockToCanvasOperation,
    removeBlockFromCanvas: removeBlockFromCanvasOperation,
    getAllBlocks: getAllBlocksOperation,
    getBlockById: getBlockByIdOperation,
    getBlockCount: getBlockCountOperation,
  } = useBlockCanvasOperations({
    reactFlow: {
      getNodes: getNodesTyped,
      setNodes,
      addNodes,
      deleteElements,
    },
  });

  // ============================================================================
  // 기존 API 유지 (래퍼 함수)
  // ============================================================================

  const createAndMountBlock = useCallback(
    async (
      blockType: BlockType,
      position: Position,
      initialProperties?: Record<string, any>,
      initialContent?: unknown,
      title?: string
    ): Promise<BlockCreatedAndMountedDTO | void> => {
      const result = await createBlock({
        blockType,
        position,
        initialProperties,
        initialContent,
        title,
      });
      return result || undefined;
    },
    [createBlock]
  );

  const softDeleteBlockMounts = useCallback(
    async (blockMountIds: string | string[]) => {
      await softDeleteBlock({ blockMountIds });
    },
    [softDeleteBlock]
  );

  const duplicateBlockAndMount = useCallback(
    async (
      blockMountId: string,
      offsetX: number = 20,
      offsetY: number = 20
    ) => {
      await duplicateBlock({ blockMountId, offsetX, offsetY });
    },
    [duplicateBlock]
  );

  const duplicateMultipleBlocksAndMount = useCallback(
    async (
      blocks: Array<{
        blockMountId: string;
        offsetX?: number;
        offsetY?: number;
      }>
    ) => {
      await duplicateBlocks({ blocks });
    },
    [duplicateBlocks]
  );

  const moveBlockToPage = useCallback(
    async (blockMountId: string, targetPageId: string) => {
      await moveBlockToPageHook({ blockMountId, targetPageId });
    },
    [moveBlockToPageHook]
  );

  return {
    // Optimistic UI 제어 (기존 API 유지)
    createAndMountBlock,
    softDeleteBlockMounts,
    duplicateBlockAndMount,
    duplicateMultipleBlocksAndMount,
    moveBlockToPage,

    // 프로그램적 제어 (기존 API 유지)
    addBlockToCanvas: addBlockToCanvasOperation,
    removeBlockFromCanvas: removeBlockFromCanvasOperation,

    // 상태 읽기 (기존 API 유지)
    getAllBlocks: getAllBlocksOperation,
    getBlockById: getBlockByIdOperation,
    getBlockCount: getBlockCountOperation,
  };
}
