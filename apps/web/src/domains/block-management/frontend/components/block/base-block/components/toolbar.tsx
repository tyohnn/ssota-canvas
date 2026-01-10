/**
 * Toolbar Component
 *
 * 상단 툴바 (BlockOriginalToolbar)
 * viewMode가 original일 때만 표시
 */

'use client';

import { BlockOriginalToolbar } from '@/domains/block-management/frontend/components/block/block-original-toolbar';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface ToolbarProps {
  data: BlockNodeData;
  selected: boolean;
  isCurrentBlockSelected: boolean;
  isSingleSelection: boolean;
  width?: number;
  height?: number;
}

export function Toolbar({
  data,
  selected,
  isCurrentBlockSelected,
  isSingleSelection,
  width,
  height,
}: ToolbarProps) {
  // 필수 데이터가 없거나 조건이 맞지 않으면 렌더링하지 않음
  if (
    !data.blockMountId ||
    !selected ||
    !isCurrentBlockSelected ||
    !isSingleSelection
  ) {
    return null;
  }

  return (
    <BlockOriginalToolbar
      blockId={data.blockMountId}
      blockMountId={data.blockMountId}
      blockType={data.blockType || 'basic'}
      blockData={data}
      width={width}
      height={height}
    />
  );
}
