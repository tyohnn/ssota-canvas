/**
 * Toolbar Component
 *
 * Container Component: Hook → Props 변환
 * 상단 툴바 (BlockToolbar)
 * DataBlock에서 전달된 toolbarProps를 사용하여 BlockToolbar 렌더링
 */

'use client';

import { BlockToolbar } from '@/domains/block-management/frontend/components/block/data-block/components/block-toolbar';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

export interface ToolbarProps {
  data: BlockNodeData;
  selected: boolean;
  isCurrentBlockSelected: boolean;
  isSingleSelection: boolean;
  width?: number;
  height?: number;
  toolbarProps?: {
    viewMode: BlockViewModeValue;
    onViewModeChange?: (viewMode: BlockViewModeValue) => void;
    zoom: number;
    isMultiSelection: boolean;
    onEdit: () => void;
    showBlockToolbarMapper?: boolean;
  };
}

export function Toolbar({
  data,
  selected,
  isCurrentBlockSelected,
  isSingleSelection,
  width,
  height,
  toolbarProps,
}: ToolbarProps) {
  const { readonly } = useCanvasReadOnly();

  // 조건 체크: toolbarProps가 없거나 선택 조건이 맞지 않으면 렌더링하지 않음
  if (
    !toolbarProps ||
    !selected ||
    !isCurrentBlockSelected ||
    !isSingleSelection
  ) {
    return null;
  }

  return (
    <BlockToolbar
      data={data}
      viewMode={toolbarProps.viewMode}
      selected={isSingleSelection}
      onViewModeChange={toolbarProps.onViewModeChange}
      width={width}
      height={height}
      zoom={toolbarProps.zoom}
      isMultiSelection={toolbarProps.isMultiSelection}
      onEdit={toolbarProps.onEdit}
      showBlockToolbarMapper={toolbarProps.showBlockToolbarMapper}
    />
  );
}
