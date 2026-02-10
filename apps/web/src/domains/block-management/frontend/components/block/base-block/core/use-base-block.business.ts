/**
 * Base Block Business Logic Hook
 *
 * 비즈니스 로직 관리
 * - 리사이즈 저장 (DB 업데이트)
 * - Prefetch 전략
 */

'use client';

import { useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';

import { prefetchAction } from '@/domains/block-management/frontend/components/block/block-action-bar/action-prefetch';
import { prefetchToolbar } from '@/domains/block-management/frontend/components/block/block-original-toolbar/toolbar-prefetch';
import { useCanvasTransform } from '@/domains/canvas-management/frontend/hooks/use-canvas-transform';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';

import type { ResizeData } from './types';

export interface BaseBlockBusinessLogic {
  // 리사이즈 저장
  saveBlockSize: (
    blockMountId: string,
    resizeData: ResizeData,
    viewMode?: 'note' | 'original' | 'card',
    previousSize?: { width: number; height: number }
  ) => Promise<{ ok: boolean; error?: string }>;

  // Prefetch
  prefetchBlockTools: (blockType: string) => void;
}

/**
 * Production 비즈니스 로직
 */
export function useBaseBlockBusiness(): BaseBlockBusinessLogic {
  const { getNodes, setNodes } = useReactFlow();
  const canvasMetadata = useCanvasMetadata();
  const { updateBlockSize } = useCanvasTransform({
    pageId: canvasMetadata.pageId,
  });

  // 리사이즈 완료 시 DB에 저장
  const saveBlockSize = useCallback(
    async (
      blockMountId: string,
      resizeData: ResizeData,
      viewMode?: 'note' | 'original' | 'card',
      previousSize?: { width: number; height: number }
    ) => {
      if (!blockMountId) {
        console.warn(
          'blockMountId가 없어서 리사이즈 정보를 저장할 수 없습니다.'
        );
        return { ok: false, error: 'Missing blockMountId' };
      }

      // 히스토리 기록은 use-canvas-transform.ts에서 처리됨
      const result = await updateBlockSize({
        blockMountId,
        newSize: {
          width: resizeData.width,
          height: resizeData.height,
        },
        previousSize, // 히스토리 기록을 위해 전달
      });

      if (!result) {
        console.error('블록 마운트 크기 업데이트 실패');
        return { ok: false, error: 'Failed to update block size' };
      }

      return { ok: true };
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
