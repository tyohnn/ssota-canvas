/**
 * Resize Control Component
 *
 * 우측 하단 리사이즈 핸들
 * 단일 선택 시에만 표시
 */

'use client';

import { NodeResizeControl } from '@xyflow/react';
import { useBaseBlockContext } from '../core/context';
import { ResizeIcon } from './resize-icon';

export function ResizeControl() {
  const {
    data,
    selected,
    isSingleSelection,
    handleResizeStart,
    handleResizeEnd,
  } = useBaseBlockContext();

  // 선택되지 않았거나 다중 선택인 경우 렌더링하지 않음
  if (!selected || !isSingleSelection || !data.blockMountId) {
    return null;
  }

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
      onResizeStart={handleResizeStart}
      onResizeEnd={handleResizeEnd}
    >
      <ResizeIcon />
    </NodeResizeControl>
  );
}
