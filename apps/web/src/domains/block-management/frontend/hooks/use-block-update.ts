'use client';

import { useOptimistic, useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  updateBlockInfoAction,
  changeBlockTypeAction,
} from '../../actions/block.actions';

export interface BlockData {
  id: string;
  blockType: string;
  title?: string;
  description?: string;
  properties: Record<string, any>;
  customProperties: Array<{
    id: string;
    name: string;
    type: string;
    options?: Array<{ id: string; label: string; color: string }>;
    order: number;
    visible: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface UseBlockUpdateResult {
  // 블록 정보 업데이트 (낙관적 업데이트)
  updateBlockInfo: (updateData: {
    title?: string;
    description?: string;
    properties?: Record<string, any>;
  }) => Promise<void>;

  // 블록 타입 변경 (낙관적 업데이트)
  changeBlockType: (newBlockType: string) => Promise<void>;

  // 상태
  isLoading: boolean;
  error: string | null;
}

/**
 * 블록 업데이트를 위한 Hook (낙관적 업데이트 패턴 적용)
 *
 * 설계 문서의 낙관적 업데이트 전략을 따름:
 * - React Flow Store 즉시 업데이트
 * - Server Action 백그라운드 동기화
 * - 실패 시 롤백
 *
 * @param blockId - 블록 ID
 * @returns 블록 업데이트 관련 함수들과 상태
 */
export function useBlockUpdate(blockId: string | null): UseBlockUpdateResult {
  const { getNode, updateNode } = useReactFlow();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 낙관적 업데이트를 위한 상태
  const [optimisticBlock, addOptimisticUpdate] = useOptimistic(
    null as BlockData | null,
    (state, update: Partial<BlockData>) =>
      ({
        ...state,
        ...update,
        updatedAt: new Date(),
      }) as BlockData
  );

  const updateBlockInfo = useCallback(
    async (updateData: {
      title?: string;
      description?: string;
      properties?: Record<string, any>;
    }) => {
      // 입력 검증
      if (!blockId) {
        setError('Invalid block ID');
        return;
      }

      if (!updateData) {
        setError('Invalid update data');
        return;
      }

      // 현재 블록 데이터 조회
      const blockNode = getNode(blockId);
      if (!blockNode) {
        setError('Block not found');
        return;
      }

      const originalData = blockNode.data;

      setIsLoading(true);
      setError(null);

      try {
        // 낙관적 업데이트: React Flow Store 즉시 반영
        const optimisticData = {
          ...originalData,
          ...updateData,
          updatedAt: new Date(),
        };
        updateNode(blockId, { data: optimisticData });

        // Server Action 호출
        const result = await updateBlockInfoAction(blockId, updateData);

        if (!result.success) {
          // 실패 시 롤백
          updateNode(blockId, { data: originalData });
          setError(result.error || 'Failed to update block');
          return;
        }
      } catch (err) {
        // 에러 시 롤백
        updateNode(blockId, { data: originalData });
        setError(err instanceof Error ? err.message : 'Failed to update block');
      } finally {
        setIsLoading(false);
      }
    },
    [blockId, getNode, updateNode]
  );

  const changeBlockType = useCallback(
    async (newBlockType: string) => {
      // 입력 검증
      if (!blockId) {
        setError('Invalid block ID');
        return;
      }

      if (!newBlockType) {
        setError('Invalid block type');
        return;
      }

      // 현재 블록 데이터 조회
      const blockNode = getNode(blockId);
      if (!blockNode) {
        setError('Block not found');
        return;
      }

      const originalData = blockNode.data;

      setIsLoading(true);
      setError(null);

      try {
        // 낙관적 업데이트: React Flow Store 즉시 반영
        const optimisticData = {
          ...originalData,
          blockType: newBlockType,
          updatedAt: new Date(),
        };
        updateNode(blockId, { data: optimisticData });

        // Server Action 호출
        const result = await changeBlockTypeAction(blockId, newBlockType);

        if (!result.success) {
          // 실패 시 롤백
          updateNode(blockId, { data: originalData });
          setError(result.error || 'Failed to change block type');
          return;
        }
      } catch (err) {
        // 에러 시 롤백
        updateNode(blockId, { data: originalData });
        setError(
          err instanceof Error ? err.message : 'Failed to change block type'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [blockId, getNode, updateNode]
  );

  return {
    updateBlockInfo,
    changeBlockType,
    isLoading,
    error,
  };
}
