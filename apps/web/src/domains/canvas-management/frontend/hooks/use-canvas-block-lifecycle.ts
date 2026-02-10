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
import { useRestoreBlock } from './block/use-restore-block';
import { useAddNodeToGroup } from './group/use-add-node-to-group';
import { useRemoveNodeFromGroup } from './group/use-remove-node-from-group';
import { useCreateGroupFromNodes } from './group/use-create-group-from-nodes';
import { useCanvasModeContext } from './mode/canvas-mode-context';
import { useCanvasHistory } from '../history';

export interface UseCanvasBlockLifecycleParams {
  pageId: string;
  reactFlow?: {
    getNodes: () => any[];
    setNodes: (updater: any) => void;
    addNodes: (nodes: any[]) => void;
    deleteElements: (params: any) => void;
    updateNode: (id: string, nodeUpdate: any) => void;
  };
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
  restoreBlockMounts: (blockMountIds: string | string[]) => Promise<void>;
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

  // React Flow hooks - 외부에서 주입받거나, 없으면 기본 훅 사용
  const reactFlowFromInstance = useReactFlow();
  const { 
    addNodes, 
    deleteElements, 
    getNodes, 
    setNodes,
    updateNode
  } = params.reactFlow || reactFlowFromInstance;

  // Canvas Mode hook
  const canvasMode = useCanvasModeContext();
  const {
    enterSingleSelectionMode,
    enterMultiSelectionMode,
    enterBlockEditingMode,
    exitToDefaultMode,
  } = canvasMode;

  // Canvas History hook
  const history = useCanvasHistory();

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

  const { restoreBlock, isRestoring } = useRestoreBlock({
    pageId,
    reactFlow: {
      getNodes: getNodesTyped,
      setNodes,
      addNodes,
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
      console.log('[BlockLifecycle] Creating block:', blockType, position);
      const result = await createBlock({
        blockType,
        position,
        initialProperties,
        initialContent,
        title,
      });
      
      // 블록 생성 성공 시 히스토리에 기록 (Undo/Redo 중이 아닐 때만)
      if (result && !history.getIsSkipping()) {
        console.log('[BlockLifecycle] Block created, recording to history:', result.blockMountId);
        
        // 서버 응답 데이터를 기반으로 표준 노드 구조 생성
        const nodeToRecord = {
          id: result.blockMountId,
          type: blockType,
          position: result.position || position,
          width: result.size?.width || 200,
          height: result.size?.height || 80,
          selected: true, // 생성 직후이므로 선택 상태로 기록
          dragging: false,
          data: {
            blockId: result.blockId,
            blockMountId: result.blockMountId,
            pageId: pageId,
            type: blockType,
            content: result.content || initialContent,
            properties: result.properties || initialProperties,
            title: result.title || title || '',
          },
        };
        
        history.recordOperation({
          type: 'BLOCK_ADD',
          blockMountId: result.blockMountId,
          data: {
            node: nodeToRecord as any,
            blockId: result.blockId,
            blockType,
            position: result.position || position,
            initialProperties: result.properties || initialProperties,
            initialContent: result.content || initialContent,
            title: result.title || title,
          },
        });
      }
      
      return result || undefined;
    },
    [createBlock, getNodes, history, pageId]
  );

  const softDeleteBlockMounts = useCallback(
    async (blockMountIds: string | string[]): Promise<void> => {
      const ids = Array.isArray(blockMountIds) ? blockMountIds : [blockMountIds];
      console.log('[BlockLifecycle] Deleting block mounts:', ids);
      
      // 1. 히스토리 기록을 위해 노드 데이터 백업
      const nodesToBackup = getNodes().filter(n => ids.includes(n.id));
      
      // 2. 히스토리 기록 (배치 처리) - Undo/Redo 중이 아닐 때만
      if (nodesToBackup.length > 0 && !history.getIsSkipping()) {
        if (nodesToBackup.length > 1) {
          history.startBatch();
        }

        nodesToBackup.forEach(node => {
          const blockData = node.data as BlockNodeData;
          history.recordOperation({
            type: 'BLOCK_DELETE',
            blockMountId: node.id,
            data: {
              node: node,
              blockId: blockData.blockId,
            },
          });
        });

        if (nodesToBackup.length > 1) {
          history.endBatch(`Delete ${nodesToBackup.length} Blocks`);
        }
      }

      await softDeleteBlock({
        blockMountIds: ids,
      });
    },
    [getNodes, softDeleteBlock, history]
  );

  const restoreBlockMounts = useCallback(
    async (blockMountIds: string | string[]): Promise<void> => {
      const ids = Array.isArray(blockMountIds) ? blockMountIds : [blockMountIds];
      console.log('[BlockLifecycle] Restoring block mounts:', ids);
      
      await restoreBlock({
        blockMountIds: ids,
      });
    },
    [restoreBlock]
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
    restoreBlockMounts,
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
