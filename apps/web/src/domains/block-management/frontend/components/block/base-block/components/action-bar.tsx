/**
 * Action Bar Component
 *
 * 우측 액션바 (BlockActionBar)
 * 단일 선택 시에만 표시
 */

'use client';

import { BlockActionBar } from '@/domains/block-management/frontend/components/block/block-action-bar';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface ActionBarProps {
  data: BlockNodeData;
  selected: boolean;
  isCurrentBlockSelected: boolean;
  isSingleSelection: boolean;
}

export function ActionBar({
  data,
  selected,
  isCurrentBlockSelected,
  isSingleSelection,
}: ActionBarProps) {
  // 필수 데이터가 없거나 조건이 맞지 않으면 렌더링하지 않음
  if (
    !data.blockId ||
    !selected ||
    !isCurrentBlockSelected ||
    !isSingleSelection
  ) {
    return null;
  }

  return (
    <BlockActionBar
      blockId={data.blockId}
      blockType={data.blockType || 'basic'}
      blockData={data}
    />
  );
}
