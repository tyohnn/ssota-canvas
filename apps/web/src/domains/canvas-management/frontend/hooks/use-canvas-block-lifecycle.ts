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
import { useBlockCanvasState } from './block/use-block-canvas-state';
import { useCreateBlock } from './block/use-create-block';
import { useDuplicateBlock } from './block/use-duplicate-block';
import { useDuplicateBlocks } from './block/use-duplicate-blocks';
import { useMoveBlockToPage } from './block/use-move-block-to-page';
import { useSoftDeleteBlock } from './block/use-soft-delete-block';
import { useAddNodeToGroup } from './group/use-add-node-to-group';
import { useRemoveNodeFromGroup } from './group/use-remove-node-from-group';
import { useCreateGroupFromNodes } from './group/use-create-group-from-nodes';
import { useCanvasModeContext } from './mode/canvas-mode-context';

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

  // Group 관리 (Optimistic UI)
  addNodeToGroup: (params: {
    childBlockMountId: string;
    parentBlockMountId: string;
    childAbsolutePosition: { x: number; y: number };
    parentPosition: { x: number; y: number };
  }) => Promise<void>;
  removeNodeFromGroup: (params: {
    childBlockMountId: string;
    parentPosition: { x: number; y: number };
    childRelativePosition: { x: number; y: number };
  }) => Promise<void>;
  createGroupFromNodes: (params: {
    nodeIds: string[];
    groupTitle?: string;
    groupColor?: string;
  }) => Promise<{ groupBlockMountId: string; groupBlockId: string }>;

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
  const { addNodes, deleteElements, getNodes, setNodes, updateNode } = useReactFlow();

  // Canvas Mode hook
  const canvasMode = useCanvasModeContext();
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
      // React Flow 노드 선택 상태를 명시적으로 설정 (다른 노드들은 선택 해제)
      setNodes(nodes =>
        nodes.map(node => ({
          ...node,
          selected: node.id === block.blockMountId,
        }))
      );
      // 단일 선택 모드로 전환
      enterSingleSelectionMode(block.blockMountId);
      // 자동으로 에디터 패널 열기
      enterBlockEditingMode(block.blockId, block.blockMountId);
    },
    onError: () => {
      exitToDefaultMode();
    },
  });

  const { softDeleteBlock, isDeleting } = useSoftDeleteBlock({
    pageId,
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

  // Group 관리 훅 (React Flow 의존성 주입)
  const addToGroupMutation = useAddNodeToGroup({
    reactFlow: {
      getNode: (id: string) => getNodes().find(n => n.id === id),
      setNodes,
      updateNode,
    },
  });
  const removeFromGroupMutation = useRemoveNodeFromGroup({
    reactFlow: {
      getNode: (id: string) => getNodes().find(n => n.id === id),
      setNodes,
      updateNode,
    },
  });
  const createGroupMutation = useCreateGroupFromNodes({
    pageId,
    reactFlow: {
      getNodes,
      getNode: (id: string) => getNodes().find(n => n.id === id),
      setNodes,
    },
  });

  // ============================================================================
  // 프로그램적 제어 & 상태 읽기
  // ============================================================================

  const {
    addBlockToCanvas: addBlockToCanvasOperation,
    removeBlockFromCanvas: removeBlockFromCanvasOperation,
    getAllBlocks: getAllBlocksOperation,
    getBlockById: getBlockByIdOperation,
    getBlockCount: getBlockCountOperation,
  } = useBlockCanvasState({
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

  // Group 관리 래퍼
  const addNodeToGroup = useCallback(
    async (params: {
      childBlockMountId: string;
      parentBlockMountId: string;
      childAbsolutePosition: { x: number; y: number };
      parentPosition: { x: number; y: number };
    }) => {
      await addToGroupMutation.mutateAsync({
        pageId,
        ...params,
      });
    },
    [addToGroupMutation, pageId]
  );

  const removeNodeFromGroup = useCallback(
    async (params: {
      childBlockMountId: string;
      parentPosition: { x: number; y: number };
      childRelativePosition: { x: number; y: number };
    }) => {
      await removeFromGroupMutation.mutateAsync({
        pageId,
        ...params,
      });
    },
    [removeFromGroupMutation, pageId]
  );

  const createGroupFromNodes = useCallback(
    async (params: {
      nodeIds: string[];
      groupTitle?: string;
      groupColor?: string;
    }) => createGroupMutation.mutateAsync(params),
    [createGroupMutation]
  );

  return {
    // Optimistic UI 제어 (기존 API 유지)
    createAndMountBlock,
    softDeleteBlockMounts,
    duplicateBlockAndMount,
    duplicateMultipleBlocksAndMount,
    moveBlockToPage,

    // Group 관리 (Optimistic UI)
    addNodeToGroup,
    removeNodeFromGroup,
    createGroupFromNodes,

    // 프로그램적 제어 (기존 API 유지)
    addBlockToCanvas: addBlockToCanvasOperation,
    removeBlockFromCanvas: removeBlockFromCanvasOperation,

    // 상태 읽기 (기존 API 유지)
    getAllBlocks: getAllBlocksOperation,
    getBlockById: getBlockByIdOperation,
    getBlockCount: getBlockCountOperation,
  };
}
