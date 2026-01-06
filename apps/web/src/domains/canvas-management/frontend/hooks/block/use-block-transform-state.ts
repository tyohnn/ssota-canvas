'use client';

import { useCallback } from 'react';

import type { Node } from '@xyflow/react';

import type {
  Position,
  Size,
} from '@/domains/canvas-management/shared/types/common.types';

import type { ReactFlowDependencies } from './use-update-block-position';

export type UseBlockTransformStateParams = {
  reactFlow: ReactFlowDependencies;
};

export type UseBlockTransformStateResult = {
  // 프로그램적 제어 (UI만 변경, 서버 호출 X)
  setBlockPosition: (blockId: string, position: Position) => void;
  setBlockSize: (blockId: string, size: Size) => void;
};

/**
 * 블록 Transform State 관리 훅
 *
 * - React Flow Store 상태만 직접 업데이트 (서버 호출 X)
 * - UI 상태만 변경하는 경우에 사용
 */
export function useBlockTransformState(
  params: UseBlockTransformStateParams
): UseBlockTransformStateResult {
  const { reactFlow } = params;
  const { setNodes } = reactFlow;

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

  return {
    // 프로그램적 제어
    setBlockPosition,
    setBlockSize,
  };
}
