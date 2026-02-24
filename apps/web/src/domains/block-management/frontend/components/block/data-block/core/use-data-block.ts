/**
 * DataBlock Hook
 *
 * DataBlock의 상태 관리 및 로직
 */
import { useCallback, useMemo } from 'react';

import { useReactFlow, useViewport } from '@xyflow/react';

import { getDefaultViewMode } from '@/domains/block-management/shared/types/block-view-modes';
import {
  CanvasMetadata,
  useCanvasMetadata,
} from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { useUpdateBlockViewMode } from '@/domains/canvas-management/frontend/hooks/use-update-block-view-mode';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';

import type { DataBlockProps } from './types';

export function useDataBlock(
  props: DataBlockProps,
  // optional injection
  canvasMetadataOverride?: CanvasMetadata
) {
  const { data, selected = false } = props;
  const { getNode, setNodes } = useReactFlow();
  const { zoom } = useViewport();

  // Canvas Metadata Context에서 pageId 가져오기
  const { pageId } = useCanvasMetadata(canvasMetadataOverride);

  // Canvas Mode Context
  const canvasMode = useCanvasModeContext();

  // View Mode 결정: data.viewMode > 기본값
  const viewMode: BlockViewModeValue = useMemo(() => {
    const computed = data.viewMode || getDefaultViewMode(data.blockType);
    return computed;
  }, [data.viewMode, data.blockType]);

  // View Mode 업데이트 훅
  const { updateViewMode } = useUpdateBlockViewMode({
    blockMountId: data.blockMountId,
    pageId: pageId,
    reactFlow: {
      getNode,
      setNodes,
    },
  });

  // View Mode 변경 핸들러
  const handleViewModeChange = async (newViewMode: BlockViewModeValue) => {
    if (!pageId) {
      console.warn('[DataBlock] pageId is required to update viewMode');
      return;
    }
    await updateViewMode(newViewMode);
  };

  // 편집 모드 진입 핸들러
  const handleEdit = useCallback(() => {
    canvasMode.enterBlockEditingMode(data.blockId, data.blockMountId);
  }, [canvasMode, data.blockId, data.blockMountId]);

  // Single selection 여부 확인
  // 에디터가 열려도 현재 블록이 편집 중이면 툴바를 표시
  // 드래그 중에도 현재 블록이 드래그 중이면 툴바를 표시
  const isSingleSelection =
    selected &&
    (canvasMode.isSingleSelectionMode() ||
      (canvasMode.isBlockEditingMode() &&
        canvasMode.mode.type === 'block-editing' &&
        canvasMode.mode.blockId === data.blockId) ||
      (canvasMode.isDraggingMode() &&
        canvasMode.mode.type === 'dragging' &&
        canvasMode.mode.blockMountIds.includes(data.blockMountId)));

  // 멀티셀렉트 여부 확인
  const isMultiSelection = canvasMode.isMultiSelectionMode();

  return {
    viewMode,
    isSingleSelection,
    onViewModeChange: handleViewModeChange,
    zoom,
    isMultiSelection,
    onEdit: handleEdit,
  };
}
