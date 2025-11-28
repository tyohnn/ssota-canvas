/**
 * Base Block Business Logic Hook
 *
 * 비즈니스 로직 관리
 * - 리사이즈 저장 (DB 업데이트)
 * - Prefetch 전략
 */

'use client';

import { useCallback } from 'react';
import { useBlockCommands } from '@/domains/block-management/frontend/hooks/use-block-commands';
import { prefetchToolbar } from '@/domains/block-management/frontend/components/block/block-mount-toolbar/toolbar-prefetch';
import { prefetchAction } from '@/domains/block-management/frontend/components/block/block-action-bar/action-prefetch';
import type { BlockSizeUpdateParams, ResizeData } from './types';

export interface BaseBlockBusinessLogic {
  // 리사이즈 저장
  saveBlockSize: (
    blockMountId: string,
    resizeData: ResizeData,
    params: Omit<BlockSizeUpdateParams, 'width' | 'height'>
  ) => Promise<{ ok: boolean; error?: string }>;

  // Prefetch
  prefetchBlockTools: (blockType: string) => void;
}

/**
 * Production 비즈니스 로직
 */
export function useBaseBlockBusiness(): BaseBlockBusinessLogic {
  const { updateBlockSize } = useBlockCommands();

  // 리사이즈 완료 시 DB에 저장
  const saveBlockSize = useCallback(
    async (
      blockMountId: string,
      resizeData: ResizeData,
      params: Omit<BlockSizeUpdateParams, 'width' | 'height'>
    ) => {
      if (!blockMountId) {
        console.warn(
          'blockMountId가 없어서 리사이즈 정보를 저장할 수 없습니다.'
        );
        return { ok: false, error: 'Missing blockMountId' };
      }

      const result = await updateBlockSize(blockMountId, {
        width: resizeData.width,
        height: resizeData.height,
        ...params,
      });

      if (!result.ok) {
        console.error('블록 마운트 크기 업데이트 실패:', result.error);
      }

      return result;
    },
    [updateBlockSize]
  );

  // Hover Prefetch: 마우스 hover 시 toolbar & action prefetch
  const prefetchBlockTools = useCallback((blockType: string) => {
    prefetchToolbar(blockType);
    prefetchAction(blockType);
  }, []);

  return {
    saveBlockSize,
    prefetchBlockTools,
  };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 */
export function useMockBaseBlockBusiness(): BaseBlockBusinessLogic {
  const saveBlockSize = useCallback(
    async (blockMountId: string, resizeData: ResizeData) => {
      console.log('[Mock] Saving block size:', { blockMountId, resizeData });
      await new Promise(resolve => setTimeout(resolve, 300));
      return { ok: true };
    },
    []
  );

  const prefetchBlockTools = useCallback((blockType: string) => {
    console.log('[Mock] Prefetching tools for:', blockType);
  }, []);

  return {
    saveBlockSize,
    prefetchBlockTools,
  };
}
