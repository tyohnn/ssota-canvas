/**
 * Resize Control View Component
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 * - Storybook에서 독립적으로 테스트 가능
 */

'use client';

import { NodeResizeControl } from '@xyflow/react';

import type { ResizeData } from '../core/types';
import { ResizeIcon } from './resize-icon';

export interface ResizeControlViewProps {
  nodeId: string;
  show: boolean;
  keepAspectRatio: boolean;
  onResizeStart: () => void;
  onResizeEnd: (event: any, resizeData: ResizeData) => Promise<void>;
}

/**
 * Resize Control View
 *
 * 실제 DOM 컨테이너 (Presentational)
 */
export function ResizeControlView({
  nodeId,
  show,
  keepAspectRatio,
  onResizeStart,
  onResizeEnd,
}: ResizeControlViewProps) {
  if (!show) {
    return null;
  }

  return (
    <NodeResizeControl
      nodeId={nodeId}
      position="bottom-right"
      style={{
        background: 'transparent',
        border: 'none',
        width: '32px',
        height: '32px',
      }}
      minWidth={100}
      minHeight={50}
      keepAspectRatio={keepAspectRatio}
      onResizeStart={onResizeStart}
      onResizeEnd={onResizeEnd}
    >
      <ResizeIcon />
    </NodeResizeControl>
  );
}
