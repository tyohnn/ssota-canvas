/**
 * Action Bar Component
 *
 * 우측 액션바 (BlockActionBar)
 * 단일 선택 시에만 표시
 */

'use client';

import { BlockActionBar } from '@/domains/block-management/frontend/components/block/block-action-bar';
import { useBaseBlockContext } from '../core/use-base-block.context';

export function ActionBar() {
  const { data, selected, isCurrentBlockSelected, isSingleSelection } =
    useBaseBlockContext();

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
    <BlockActionBar
      blockId={data.blockMountId}
      blockType={data.blockType || 'basic'}
      blockData={data}
      pageId={data.pageId}
      orgId={data.orgId}
      workspaceId={data.workspaceId}
    />
  );
}
