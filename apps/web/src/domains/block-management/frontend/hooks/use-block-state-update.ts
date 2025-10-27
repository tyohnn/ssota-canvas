'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  isBlockSkeleton,
  isBlockCompleted,
} from '../../shared/schemas/block-type-schemas';

/**
 * Block State Update Hook
 *
 * React Flow 노드의 상태를 업데이트하는 훅
 * - 스켈레톤/완성 상태 전환
 * - 블록 속성 변경 시 상태 자동 업데이트
 */
export function useBlockStateUpdate() {
  const { getNode, updateNode, setNodes } = useReactFlow();

  /**
   * 블록의 렌더링 상태 업데이트
   *
   * @param blockId - 블록 ID
   * @param blockType - 블록 타입
   * @param properties - 블록 속성
   */
  const updateBlockRenderState = useCallback(
    (blockId: string, blockType: string, properties: Record<string, any>) => {
      const node = getNode(blockId);
      if (!node) return;

      // 상태 계산
      const isSkeleton = isBlockSkeleton(blockType, properties);
      const isCompleted = isBlockCompleted(blockType, properties);
      const renderState = isCompleted ? 'completed' : 'skeleton';

      // 노드 데이터 업데이트
      updateNode(blockId, {
        data: {
          ...node.data,
          state: renderState,
          isSkeleton,
          isCompleted,
          properties,
        },
      });
    },
    [getNode, updateNode]
  );

  /**
   * 블록 속성 변경 시 상태 자동 업데이트
   *
   * @param blockId - 블록 ID
   * @param newProperties - 새로운 속성
   */
  const updateBlockProperties = useCallback(
    (blockId: string, newProperties: Record<string, any>) => {
      const node = getNode(blockId);
      if (!node) return;

      const blockType = node.data.blockType;
      const updatedProperties = { ...node.data.properties, ...newProperties };

      // 상태 업데이트
      updateBlockRenderState(blockId, blockType, updatedProperties);
    },
    [getNode, updateBlockRenderState]
  );

  /**
   * 여러 블록의 상태를 일괄 업데이트
   *
   * @param updates - 업데이트할 블록 정보 배열
   */
  const updateMultipleBlockStates = useCallback(
    (
      updates: Array<{
        blockId: string;
        blockType: string;
        properties: Record<string, any>;
      }>
    ) => {
      setNodes(nodes =>
        nodes.map(node => {
          const update = updates.find(u => u.blockId === node.id);
          if (!update) return node;

          const isSkeleton = isBlockSkeleton(
            update.blockType,
            update.properties
          );
          const isCompleted = isBlockCompleted(
            update.blockType,
            update.properties
          );
          const renderState = isCompleted ? 'completed' : 'skeleton';

          return {
            ...node,
            data: {
              ...node.data,
              state: renderState,
              isSkeleton,
              isCompleted,
              properties: update.properties,
            },
          };
        })
      );
    },
    [setNodes]
  );

  /**
   * 블록이 스켈레톤 상태인지 확인
   *
   * @param blockId - 블록 ID
   * @returns 스켈레톤 상태 여부
   */
  const isBlockSkeletonState = useCallback(
    (blockId: string): boolean => {
      const node = getNode(blockId);
      if (!node) return false;

      return node.data.state === 'skeleton' || node.data.isSkeleton === true;
    },
    [getNode]
  );

  /**
   * 블록이 완성된 상태인지 확인
   *
   * @param blockId - 블록 ID
   * @returns 완성 상태 여부
   */
  const isBlockCompletedState = useCallback(
    (blockId: string): boolean => {
      const node = getNode(blockId);
      if (!node) return false;

      return node.data.state === 'completed' || node.data.isCompleted === true;
    },
    [getNode]
  );

  return {
    updateBlockRenderState,
    updateBlockProperties,
    updateMultipleBlockStates,
    isBlockSkeletonState,
    isBlockCompletedState,
  };
}
