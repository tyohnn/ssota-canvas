/**
 * Toolbar Component
 *
 * 상단 툴바 (BlockMountToolbar)
 * 단일 선택 시에만 표시
 */

'use client';

import { BlockMountToolbar } from '@/domains/block-management/frontend/components/block/block-mount-toolbar';
import { useBaseBlockContext } from '../core/use-base-block.context';

export function Toolbar() {
  const {
    data,
    selected,
    isCurrentBlockSelected,
    isSingleSelection,
    width,
    height,
  } = useBaseBlockContext();

  // 필수 데이터가 없거나 조건이 맞지 않으면 렌더링하지 않음
  if (
    !data.blockMountId ||
    !data.pageId ||
    !data.workspaceId ||
    !selected ||
    !isCurrentBlockSelected ||
    !isSingleSelection
  ) {
    return null;
  }

  return (
    <BlockMountToolbar
      blockId={data.blockMountId}
      blockMountId={data.blockMountId}
      blockType={data.blockType || 'basic'}
      blockData={data}
      pageId={data.pageId}
      orgId={data.orgId}
      workspaceId={data.workspaceId}
      width={width}
      height={height}
    />
  );
}
