/**
 * Handles View Component
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 * - Storybook에서 독립적으로 테스트 가능
 */

'use client';

import { Handle, Position } from '@xyflow/react';

// 핸들 크기: w-5 h-5 (20px × 20px)
// 하늘색 계열 유리구슬 느낌
const handleClassName =
  'w-4! h-4! bg-sky-500/70! backdrop-blur-md! border! border-sky-400/100! rounded-full! shadow-lg! transition-all z-[60]!';

// 숨김 상태: 크기를 최소화하여 엣지가 블록 경계에 가깝게 연결되도록 함
// 핸들이 노드 경계 바깥에 위치하므로, 작게 만들어야 엣지가 경계에 닿음
const hiddenHandleClassName =
  'w-px! h-px! bg-transparent! border-0! opacity-0! pointer-events-none! transition-all z-[60]!';

export interface HandlesViewProps {
  isConnectable: boolean;
  showLeft: boolean;
  showRight: boolean;
  showTop: boolean;
  showBottom: boolean;
}

/**
 * Handles View
 *
 * 실제 DOM 컨테이너 (Presentational)
 */
export function HandlesView({
  isConnectable,
  showLeft,
  showRight,
  showTop,
  showBottom,
}: HandlesViewProps) {
  return (
    <>
      {/* Left - Source & Target */}
      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
        id="left"
        className={showLeft ? handleClassName : hiddenHandleClassName}
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        id="left"
        className={showLeft ? handleClassName : hiddenHandleClassName}
      />

      {/* Right - Source & Target */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        id="right"
        className={showRight ? handleClassName : hiddenHandleClassName}
      />
      <Handle
        type="target"
        position={Position.Right}
        isConnectable={isConnectable}
        id="right"
        className={showRight ? handleClassName : hiddenHandleClassName}
      />

      {/* Top - Source & Target */}
      <Handle
        type="source"
        position={Position.Top}
        isConnectable={isConnectable}
        id="top"
        className={showTop ? handleClassName : hiddenHandleClassName}
      />
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        id="top"
        className={showTop ? handleClassName : hiddenHandleClassName}
      />

      {/* Bottom - Source & Target */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        id="bottom"
        className={showBottom ? handleClassName : hiddenHandleClassName}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        isConnectable={isConnectable}
        id="bottom"
        className={showBottom ? handleClassName : hiddenHandleClassName}
      />
    </>
  );
}
