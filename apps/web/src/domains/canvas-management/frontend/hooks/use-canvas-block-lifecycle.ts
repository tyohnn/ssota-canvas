'use client';

import { useCallback } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';
import { createBlockAction } from '../../actions/block.actions';
import { useCanvasMode } from '../contexts/canvas-mode-context';
import { isFailure } from '@/lib/action-result';
import type { BasicBlockNodeData } from '../acl/react-flow.acl';

/**
 * 블록 타입별 기본 크기 정의 (SkeletonBlock과 동일)
 */
const BLOCK_TYPE_SIZES: Record<string, { width: number; height: number }> = {
  basic: { width: 200, height: 150 },
  'shape-square': { width: 150, height: 150 },
  'shape-circle': { width: 150, height: 150 },
  image: { width: 300, height: 200 },
  video: { width: 400, height: 225 },
  map: { width: 350, height: 250 },
};

export interface CreateBlockParams {
  pageId: string;
  orgId?: string;
}

export interface BlockData {
  blockType: string;
  blockMountId?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  [key: string]: any;
}

export interface UseCanvasBlockLifecycleResult {
  // Optimistic UI 제어 (사용자 액션, AI Tool Call)
  createBlock: (
    blockType: string,
    position: { x: number; y: number },
    workspaceId: string,
    orgId?: string
  ) => Promise<void>;

  // 프로그램적 제어 (UI만 변경, 서버 호출 X)
  addBlockToCanvas: (blockId: string, blockData: BlockData) => void;
  removeBlockFromCanvas: (blockId: string) => void;

  // 상태 읽기
  getAllBlocks: () => any[];
  getBlockById: (blockId: string) => any | undefined;
  getBlockCount: () => number;
}

/**
 * Block 생명주기 관리 Hook (Layer 1)
 *
 * - Optimistic UI 패턴으로 블럭 생성/삭제 처리
 * - React Flow Store를 SSOT로 사용
 * - 서버 액션과의 동기화 처리
 */
export function useCanvasBlockLifecycle(
  params: CreateBlockParams
): UseCanvasBlockLifecycleResult {
  const { pageId, orgId } = params;

  // React Flow hooks
  const { addNodes, deleteElements, getNodes, updateNode } = useReactFlow();

  // Canvas Mode hook
  const { enterSingleSelectionMode, exitToDefaultMode } = useCanvasMode();

  /**
   * 고유한 Optimistic ID 생성
   */
  const generateOptimisticId = useCallback(() => {
    return `optimistic-${crypto.randomUUID()}`;
  }, []);

  /**
   * 블럭 생성 (Optimistic UI)
   */
  const createBlock = useCallback(
    async (
      blockType: string,
      position: { x: number; y: number },
      workspaceId: string,
      orgIdParam?: string
    ) => {
      const optimisticId = generateOptimisticId();

      try {
        // 블록 타입별 크기 가져오기
        const blockSizeDef =
          BLOCK_TYPE_SIZES[blockType] || BLOCK_TYPE_SIZES.basic;
        const blockSize = {
          width: blockSizeDef?.width ?? 200,
          height: blockSizeDef?.height ?? 150,
        };

        // 1. 임시 노드 생성 및 React Flow Store에 즉시 추가
        const optimisticNodeData: BasicBlockNodeData = {
          blockMountId: '',
          blockId: '',
          blockType: blockType as 'basic', // 타입 단언으로 안전성 확보
          position,
          size: blockSize, // 블록 타입별 동적 크기
          zOrder: 1,
          isOptimistic: true,
          // 임시 데이터로 빠른 UI 반응
          _optimisticId: optimisticId,
        };

        const optimisticNode = {
          id: optimisticId,
          type: blockType as 'basic', // blockType을 노드 타입으로 사용
          position,
          data: optimisticNodeData,
        } as Node; // React Flow Node 타입으로 캐스팅

        addNodes([optimisticNode]);

        // 2. 서버 액션 호출
        const result = await createBlockAction({
          pageId,
          blockType,
          position,
          workspaceId,
          orgId: orgIdParam || orgId,
        });

        if (result.success && result.data) {
          // 3. 성공 시: 임시 노드를 실제 노드로 교체
          const { blockMountId, blockId } = result.data;

          // 임시 노드 제거
          deleteElements({ nodes: [{ id: optimisticId }] });

          // 실제 노드 추가
          const realNodeData: BasicBlockNodeData = {
            blockMountId,
            blockId,
            blockType: blockType as 'basic',
            position: result.data.position,
            size: result.data.size,
            zOrder: result.data.zOrder,
            isOptimistic: false,
          };

          const realNode = {
            id: blockMountId, // blockMountId를 노드 ID로 사용 (ACL과 일치)
            type: blockType as 'basic', // blockType을 노드 타입으로 사용
            position: result.data.position,
            data: realNodeData,
          } as Node; // React Flow Node 타입으로 캐스팅

          addNodes([realNode]);

          // 4. 단일 선택 모드로 전환 (blockMountId를 사용)
          enterSingleSelectionMode(blockMountId);
        } else {
          // 5. 실패 시: 임시 노드 제거
          deleteElements({ nodes: [{ id: optimisticId }] });

          // 기본 모드로 복귀
          exitToDefaultMode();

          // 에러 처리 (추후 Toast 메시지 등으로 확장)
          console.error(
            'Block creation failed:',
            isFailure(result) ? result.error : 'Unknown error'
          );
        }
      } catch (error) {
        // 6. 예외 발생 시: 임시 노드 제거
        deleteElements({ nodes: [{ id: optimisticId }] });
        exitToDefaultMode();

        console.error('Block creation error:', error);
      }
    },
    [
      pageId,
      orgId,
      generateOptimisticId,
      addNodes,
      deleteElements,
      enterSingleSelectionMode,
      exitToDefaultMode,
    ]
  );

  /**
   * 프로그램적 제어: UI에만 블럭 추가 (서버 저장 X)
   */
  const addBlockToCanvas = useCallback(
    (blockId: string, blockData: BlockData) => {
      const nodeData: BasicBlockNodeData = {
        blockMountId: blockData.blockMountId || blockId,
        blockId,
        blockType: blockData.blockType as 'basic',
        position: blockData.position,
        size: blockData.size,
        zOrder: 1,
        isOptimistic: false,
      };

      const node = {
        id: blockData.blockMountId || blockId,
        type: blockData.blockType as 'basic', // blockType을 노드 타입으로 사용
        position: blockData.position,
        data: nodeData,
      } as Node; // React Flow Node 타입으로 캐스팅

      addNodes([node]);
    },
    [addNodes]
  );

  /**
   * 프로그램적 제어: UI에서만 블럭 제거 (서버 저장 X)
   */
  const removeBlockFromCanvas = useCallback(
    (blockId: string) => {
      deleteElements({ nodes: [{ id: blockId }] });
    },
    [deleteElements]
  );

  /**
   * 모든 블럭 조회
   */
  const getAllBlocks = useCallback(() => {
    return getNodes();
  }, [getNodes]);

  /**
   * 특정 블럭 조회
   */
  const getBlockById = useCallback(
    (blockId: string) => {
      const nodes = getNodes();
      return nodes.find(node => node.id === blockId);
    },
    [getNodes]
  );

  /**
   * 블럭 개수 조회
   */
  const getBlockCount = useCallback(() => {
    return getNodes().length;
  }, [getNodes]);

  return {
    createBlock,
    addBlockToCanvas,
    removeBlockFromCanvas,
    getAllBlocks,
    getBlockById,
    getBlockCount,
  };
}
