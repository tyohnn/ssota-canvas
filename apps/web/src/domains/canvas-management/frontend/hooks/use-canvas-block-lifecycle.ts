'use client';

import React, { useCallback } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';
import {
  createBlockAction,
  deleteBlockMountAction,
  deleteMultipleBlockMountsAction,
  duplicateBlockAction,
} from '../../actions/block.actions';
import { useCanvasMode } from '../contexts/canvas-mode-context';
import { isFailure } from '@/lib/action-result';
import type { BlockNodeData } from '../../../block-management/shared/types/block-data.types';
import { createBlockNodeData } from '../../../block-management/shared/types/block-data.types';
import {
  BlockType,
  getBlockSize,
} from '../../../block-management/shared/types/block-types';

export interface CreateBlockParams {
  pageId: string;
  orgId?: string;
}

// BlockData 인터페이스 제거 - React Flow Node 타입을 직접 사용

export interface UseCanvasBlockLifecycleResult {
  // Optimistic UI 제어 (사용자 액션, AI Tool Call)
  createBlock: (
    blockType: BlockType,
    position: { x: number; y: number },
    workspaceId: string,
    orgId?: string
  ) => Promise<void>;
  deleteBlock: (
    blockMountId: string,
    workspaceId?: string,
    pageIdParam?: string,
    orgIdParam?: string
  ) => Promise<void>;
  deleteMultipleBlocks: (
    blockMountIds: string[],
    workspaceId?: string,
    pageIdParam?: string,
    orgIdParam?: string
  ) => Promise<void>;
  duplicateBlock: (
    blockMountId: string,
    workspaceId: string,
    offsetX?: number,
    offsetY?: number
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
  const { addNodes, deleteElements, getNodes, updateNode, setNodes } =
    useReactFlow();

  // Canvas Mode hook
  const canvasMode = useCanvasMode();
  const { enterSingleSelectionMode, exitToDefaultMode, enterBlockEditingMode } =
    canvasMode;

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
      blockType: BlockType,
      position: { x: number; y: number },
      workspaceId: string,
      orgIdParam?: string
    ) => {
      const optimisticId = generateOptimisticId();

      try {
        // 블록 타입별 크기 가져오기
        const blockSize = getBlockSize(blockType);

        // 1. 임시 노드 생성 및 React Flow Store에 즉시 추가
        const optimisticNodeData: BlockNodeData = createBlockNodeData(
          blockType,
          {
            blockMountId: '',
            blockId: '',
            pageId,
            orgId: orgIdParam || orgId,
            workspaceId,
          }
        );

        const optimisticNode = {
          id: optimisticId,
          type: blockType, // blockType을 노드 타입으로 사용
          position,
          data: optimisticNodeData,
          width: blockSize.width,
          height: blockSize.height,
          zIndex: 1,
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
          const realNodeData: BlockNodeData = createBlockNodeData(
            blockType as BlockType,
            {
              blockMountId,
              blockId,
              pageId,
              orgId: orgIdParam || orgId,
              workspaceId,
              // createdBy, createdAt, updatedAt는 별도 조회 필요
            }
          );

          const realNode = {
            id: blockMountId, // blockMountId를 노드 ID로 사용 (ACL과 일치)
            type: blockType, // blockType을 노드 타입으로 사용
            position: result.data.position,
            data: realNodeData,
            width: result.data.size.width,
            height: result.data.size.height,
            zIndex: result.data.zOrder,
          } as Node; // React Flow Node 타입으로 캐스팅

          addNodes([realNode]);

          // 4. 단일 선택 모드로 전환 (blockMountId를 사용)
          enterSingleSelectionMode(blockMountId);

          // 5. 자동으로 에디터 패널 열기
          enterBlockEditingMode(result.data.blockId);
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
      enterBlockEditingMode,
    ]
  );

  /**
   * 프로그램적 제어: UI에만 블럭 추가 (서버 저장 X)
   */
  const addBlockToCanvas = useCallback(
    (
      blockId: string,
      nodeData: BlockNodeData,
      position: { x: number; y: number },
      size: { width: number; height: number }
    ) => {
      const node = {
        id: nodeData.blockMountId || blockId,
        type: nodeData.blockType, // blockType을 노드 타입으로 사용
        position,
        data: nodeData,
        width: size.width,
        height: size.height,
        zIndex: 1,
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

  /**
   * 블럭 삭제 (Optimistic UI)
   * Story CM-008 구현 - 단일 블럭 삭제
   */
  const deleteBlock = useCallback(
    async (
      blockMountId: string,
      workspaceId?: string,
      pageIdParam?: string,
      orgIdParam?: string
    ) => {
      // 삭제 전 노드 백업 (롤백용)
      const nodeToDelete = getNodes().find(node => node.id === blockMountId);

      if (!nodeToDelete) {
        console.warn(`Node with id ${blockMountId} not found`);
        return;
      }

      // Optimistic 노드인 경우 (아직 서버에 저장되지 않음)
      const isOptimisticNode = blockMountId.startsWith('optimistic-');

      if (isOptimisticNode) {
        // Optimistic 노드는 서버에 없으므로 UI에서만 제거
        deleteElements({ nodes: [{ id: blockMountId }] });
        exitToDefaultMode();
        console.log(
          '✅ Optimistic block removed from UI (not yet saved to server)'
        );
        return;
      }

      try {
        // 1. 즉시 React Flow Store에서 제거 (Optimistic UI)
        deleteElements({ nodes: [{ id: blockMountId }] });

        // 2. 서버 액션 호출
        const result = await deleteBlockMountAction({
          blockMountId,
          orgId: orgIdParam || orgId,
          workspaceId,
          pageId: pageIdParam || pageId,
        });

        if (result.success && result.data) {
          // 3. 성공: 기본 모드로 복귀
          exitToDefaultMode();

          console.log(
            `✅ Block deleted successfully. Deleted ${result.data.deletedEdgesCount} connected edges.`
          );
        } else {
          // 4. 실패 시: 노드 복원
          addNodes([nodeToDelete]);

          console.error(
            'Block deletion failed:',
            isFailure(result) ? result.error : 'Unknown error'
          );
        }
      } catch (error) {
        // 5. 예외 발생 시: 노드 복원
        addNodes([nodeToDelete]);

        console.error('Block deletion error:', error);
      }
    },
    [pageId, orgId, getNodes, deleteElements, addNodes, exitToDefaultMode]
  );

  /**
   * 다중 블럭 삭제 (Optimistic UI)
   * Story CM-008 구현 - 다중 블럭 삭제
   */
  const deleteMultipleBlocks = useCallback(
    async (
      blockMountIds: string[],
      workspaceId?: string,
      pageIdParam?: string,
      orgIdParam?: string
    ) => {
      // 삭제 전 노드들 백업 (롤백용)
      const nodesToDelete = getNodes().filter(node =>
        blockMountIds.includes(node.id)
      );

      if (nodesToDelete.length === 0) {
        console.warn('No nodes found to delete');
        return;
      }

      // Optimistic 노드와 실제 노드 분리
      const optimisticNodes = nodesToDelete.filter(node =>
        node.id.startsWith('optimistic-')
      );
      const realNodes = nodesToDelete.filter(
        node => !node.id.startsWith('optimistic-')
      );

      // Optimistic 노드만 있는 경우 서버 호출 없이 종료
      if (realNodes.length === 0) {
        // 모든 노드를 UI에서 즉시 제거
        deleteElements({
          nodes: nodesToDelete.map(node => ({ id: node.id })),
        });
        exitToDefaultMode();
        console.log(
          `✅ ${optimisticNodes.length} optimistic block(s) removed from UI (not yet saved to server)`
        );
        return;
      }

      // 실제 노드만 서버 액션 호출
      const realBlockMountIds = realNodes.map(node => node.id);

      try {
        // 모든 노드를 UI에서 즉시 제거
        deleteElements({
          nodes: nodesToDelete.map(node => ({ id: node.id })),
        });

        const result = await deleteMultipleBlockMountsAction({
          blockMountIds: realBlockMountIds,
          orgId: orgIdParam || orgId,
          workspaceId,
          pageId: pageIdParam || pageId,
        });

        if (result.success && result.data) {
          // 성공: 기본 모드로 복귀
          exitToDefaultMode();

          const totalDeleted =
            result.data.deletedCount + optimisticNodes.length;
          console.log(
            `✅ ${totalDeleted} block(s) deleted (${result.data.deletedCount} from server, ${optimisticNodes.length} optimistic). Deleted ${result.data.deletedEdgesCount} connected edges.`
          );
        } else {
          // 실패 시: 실제 노드들만 복원 (optimistic 노드는 복원하지 않음)
          addNodes(realNodes);

          console.error(
            'Multiple blocks deletion failed:',
            isFailure(result) ? result.error : 'Unknown error'
          );
        }
      } catch (error) {
        // 예외 발생 시: 실제 노드들만 복원
        addNodes(realNodes);

        console.error('Multiple blocks deletion error:', error);
      }
    },
    [pageId, orgId, getNodes, deleteElements, addNodes, exitToDefaultMode]
  );

  const duplicateBlock = useCallback(
    async (
      blockMountId: string,
      workspaceId: string,
      offsetX: number = 20,
      offsetY: number = 20
    ) => {
      // 1. 원본 블럭 정보 조회
      const originalNodes = getNodes();
      const originalNode = originalNodes.find(
        node => (node.data as any)?.blockMountId === blockMountId
      );

      if (!originalNode) {
        console.error('Original block not found for duplication');
        return;
      }

      // 2. Optimistic ID 생성
      const optimisticId = generateOptimisticId();
      const optimisticBlockMountId = `optimistic-${optimisticId}`;

      // 3. 복제된 위치 계산
      const duplicatedPosition = {
        x: originalNode.position.x + offsetX,
        y: originalNode.position.y + offsetY,
      };

      // 4. Optimistic 블럭 데이터 생성
      const originalBlockType =
        (originalNode.data as any)?.blockType || BlockType.TEXT;
      const optimisticNodeData: BlockNodeData = createBlockNodeData(
        originalBlockType,
        {
          blockMountId: optimisticBlockMountId,
          blockId: optimisticId,
          pageId,
          orgId,
          workspaceId,
        }
      );

      // 5. 즉시 UI에 복제된 블럭 추가 (Optimistic UI)
      addBlockToCanvas(
        optimisticId,
        optimisticNodeData,
        duplicatedPosition,
        (originalNode.data as any)?.size || getBlockSize(originalBlockType)
      );

      // 6. 복제된 블럭을 자동으로 선택 (프로그래밍적 선택)
      setTimeout(() => {
        // 모든 노드의 선택 상태를 해제
        setNodes(nodes => nodes.map(node => ({ ...node, selected: false })));

        // 복제된 블럭만 선택
        setNodes(nodes =>
          nodes.map(node =>
            node.id === optimisticBlockMountId
              ? { ...node, selected: true }
              : node
          )
        );

        // Canvas Mode도 업데이트
        canvasMode.enterSingleSelectionMode(optimisticBlockMountId);
      }, 100);

      try {
        // 7. 서버에 복제 요청
        const result = await duplicateBlockAction({
          blockMountId,
          workspaceId,
          offsetX,
          offsetY,
        });

        if (result.success && result.data) {
          // 8. 성공: Optimistic 블럭을 실제 데이터로 교체
          const realNodeData: BlockNodeData = createBlockNodeData(
            originalBlockType,
            {
              blockMountId: result.data.duplicatedBlockMountId,
              blockId: result.data.duplicatedBlockId,
              pageId,
              orgId,
              workspaceId,
            }
          );

          // Optimistic 블럭 제거
          deleteElements({ nodes: [{ id: optimisticBlockMountId }] });

          // 실제 블럭 추가
          addBlockToCanvas(
            result.data.duplicatedBlockId,
            realNodeData,
            result.data.position,
            result.data.size
          );

          // 실제 블럭으로 선택 상태 업데이트 (프로그래밍적 선택)
          setTimeout(() => {
            // 모든 노드의 선택 상태를 해제
            setNodes(nodes =>
              nodes.map(node => ({ ...node, selected: false }))
            );

            // 실제 복제된 블럭만 선택
            setNodes(nodes =>
              nodes.map(node =>
                node.id === result.data.duplicatedBlockMountId
                  ? { ...node, selected: true }
                  : node
              )
            );

            // Canvas Mode도 업데이트
            canvasMode.enterSingleSelectionMode(
              result.data.duplicatedBlockMountId
            );
          }, 100);
        } else {
          // 9. 실패: Optimistic 블럭 제거
          deleteElements({ nodes: [{ id: optimisticBlockMountId }] });
          exitToDefaultMode();
        }
      } catch (error) {
        // 10. 예외 발생: Optimistic 블럭 제거
        deleteElements({ nodes: [{ id: optimisticBlockMountId }] });
        exitToDefaultMode();
        console.error('Block duplication error:', error);
      }
    },
    [
      getNodes,
      generateOptimisticId,
      addBlockToCanvas,
      deleteElements,
      setNodes,
      canvasMode,
      exitToDefaultMode,
    ]
  );

  return {
    createBlock,
    deleteBlock,
    deleteMultipleBlocks,
    duplicateBlock,
    addBlockToCanvas,
    removeBlockFromCanvas,
    getAllBlocks,
    getBlockById,
    getBlockCount,
  };
}
