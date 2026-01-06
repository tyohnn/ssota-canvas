'use client';

import { useCallback } from 'react';

import type { Node } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import type {
  Position,
  Size,
} from '@/domains/canvas-management/shared/types/common.types';

export type ReactFlowDependencies = {
  getNodes: () => Node[];
  setNodes: (nodes: Node[]) => void;
  addNodes: (nodes: Node[]) => void;
  deleteElements: (elements: { nodes: Array<{ id: string }> }) => void;
};

export type UseBlockCanvasStateParams = {
  reactFlow: ReactFlowDependencies;
};

export type UseBlockCanvasStateResult = {
  addBlockToCanvas: (
    blockId: string,
    nodeData: BlockNodeData,
    position: Position,
    size: Size
  ) => void;
  removeBlockFromCanvas: (blockId: string) => void;
  getAllBlocks: () => Node[];
  getBlockById: (blockId: string) => Node | undefined;
  getBlockCount: () => number;
};

/**
 * 블록 Canvas State 관리 Hook
 *
 * React Flow Store 상태만 관리하는 함수들을 제공합니다.
 * - React Flow Store 직접 조작
 * - 순수 함수만 제공 (useCallback 사용)
 * - TanStack Query 사용 X
 * - 서버 호출 없이 UI 상태만 관리
 */
export function useBlockCanvasState(
  params: UseBlockCanvasStateParams
): UseBlockCanvasStateResult {
  const { reactFlow } = params;
  const { getNodes, addNodes, deleteElements } = reactFlow;

  /**
   * 프로그램적 제어: UI에만 블럭 추가 (서버 저장 X)
   */
  const addBlockToCanvas = useCallback(
    (
      blockId: string,
      nodeData: BlockNodeData,
      position: Position,
      size: Size
    ) => {
      const node = {
        id: nodeData.blockMountId || blockId,
        type: nodeData.blockType, // blockType을 노드 타입으로 사용
        position,
        data: nodeData,
        width: size.width,
        height: size.height,
        zIndex: 1,
      } as CustomNodeType; // React Flow Node 타입으로 캐스팅

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
    addBlockToCanvas,
    removeBlockFromCanvas,
    getAllBlocks,
    getBlockById,
    getBlockCount,
  };
}
