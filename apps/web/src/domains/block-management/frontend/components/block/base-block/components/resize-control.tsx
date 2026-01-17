/**
 * Resize Control Component
 *
 * 우측 하단 리사이즈 핸들
 * 단일 선택 시에만 표시
 * 이미지 블록은 종횡비 고정
 */

'use client';

import { NodeResizeControl } from '@xyflow/react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

import type { ResizeData } from '../core/types';
import { ResizeIcon } from './resize-icon';

// 종횡비 유지가 필요한 블록 타입들
const ASPECT_RATIO_LOCKED_BLOCK_TYPES = [
  BlockType.IMAGE,
  BlockType.YOUTUBE,
] as const;

export interface ResizeControlProps {
  data: BlockNodeData;
  selected: boolean;
  isSingleSelection: boolean;
  handleResizeStart: () => void;
  handleResizeEnd: (event: any, resizeData: ResizeData) => Promise<void>;
}

export function ResizeControl({
  data,
  selected,
  isSingleSelection,
  handleResizeStart,
  handleResizeEnd,
}: ResizeControlProps) {
  // 선택되지 않았거나 다중 선택인 경우 렌더링하지 않음
  if (!selected || !isSingleSelection || !data.blockMountId) {
    return null;
  }

  // 이미지/YouTube 블록이고 오리지널 뷰일 때만 가로세로비 고정
  const isAspectRatioLockedBlock = ASPECT_RATIO_LOCKED_BLOCK_TYPES.includes(
    data.blockType as (typeof ASPECT_RATIO_LOCKED_BLOCK_TYPES)[number]
  );
  const isOriginalView = data.viewMode === 'original';
  const shouldKeepAspectRatio = isAspectRatioLockedBlock && isOriginalView;

  return (
    <NodeResizeControl
      nodeId={data.blockMountId}
      position="bottom-right"
      style={{
        background: 'transparent',
        border: 'none',
        width: '32px',
        height: '32px',
      }}
      minWidth={100}
      minHeight={50}
      keepAspectRatio={shouldKeepAspectRatio}
      onResizeStart={handleResizeStart}
      onResizeEnd={handleResizeEnd}
    >
      <ResizeIcon />
    </NodeResizeControl>
  );
}
