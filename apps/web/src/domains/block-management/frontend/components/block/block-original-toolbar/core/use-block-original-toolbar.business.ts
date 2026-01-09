/**
 * Block Original Toolbar Business Hook
 *
 * 비즈니스 로직: 도메인 훅을 조합하여 컴포넌트 특화 로직 제공
 */

'use client';

import { useMemo } from 'react';

import { useReactFlow, useViewport } from '@xyflow/react';

import { getDefaultViewMode } from '@/domains/block-management/shared/types/block-view-modes';
import {
  useCanvasMetadata,
  useCanvasModeContext,
} from '@/domains/canvas-management/frontend/hooks';
import { useUpdateBlockViewMode } from '@/domains/canvas-management/frontend/hooks/use-update-block-view-mode';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';

import type { BlockOriginalToolbarBusinessLogic } from './types';
import type { BlockOriginalToolbarProps } from './types';

/**
 * Block Original Toolbar Business Hook
 *
 * 도메인 훅을 조합하여 컴포넌트 특화 비즈니스 로직 제공
 */
export function useBlockOriginalToolbarBusiness(
  props: BlockOriginalToolbarProps
): BlockOriginalToolbarBusinessLogic {
  const { blockMountId, blockData, blockId } = props;
  const canvasMode = useCanvasModeContext();
  const { zoom } = useViewport();
  const { getNode, updateNode } = useReactFlow();
  const { pageId } = useCanvasMetadata();

  // View Mode 결정: data.viewMode > 기본값
  const viewMode: BlockViewModeValue = useMemo(() => {
    const computed =
      blockData.viewMode || getDefaultViewMode(blockData.blockType);
    return computed;
  }, [blockData.viewMode, blockData.blockType]);

  // View Mode 업데이트 훅
  const { updateViewMode } = useUpdateBlockViewMode({
    blockMountId,
    pageId: pageId || '',
    reactFlow: {
      getNode,
      updateNode,
    },
  });

  // View Mode 변경 핸들러
  const handleViewModeChange = async (newViewMode: BlockViewModeValue) => {
    if (!pageId) {
      console.warn(
        '[BlockOriginalToolbar] pageId is required to update viewMode'
      );
      return;
    }
    await updateViewMode(newViewMode);
  };

  // Details 버튼 핸들러 (에디터 패널 열기)
  const handleDetails = () => {
    canvasMode.enterBlockEditingMode(blockId);
  };

  return {
    viewMode,
    zoom,
    pageId,
    handleViewModeChange,
    handleDetails,
  };
}
