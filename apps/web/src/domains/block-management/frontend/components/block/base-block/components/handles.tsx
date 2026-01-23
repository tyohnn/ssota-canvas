/**
 * Handles Component
 *
 * 상하좌우 연결점 (Connection Handles)
 * - 각 위치에 source와 target Handle 모두 배치
 * - source: 이 노드에서 엣지가 시작
 * - target: 이 노드에서 엣지가 끝남
 * - E010-002: 기본 숨김, 호버 시 또는 연결 모드에서만 표시
 */

'use client';

import { Handle, Position } from '@xyflow/react';

import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import type { HoverDirection } from '../core/types';

// 핸들 크기: w-5 h-5 (20px × 20px)
// 하늘색 계열 유리구슬 느낌
const handleClassName =
  'w-4! h-4! bg-sky-500/70! backdrop-blur-md! border! border-sky-400/100! rounded-full! shadow-lg! transition-all z-[60]!';

// 숨김 상태: 크기를 최소화하여 엣지가 블록 경계에 가깝게 연결되도록 함
// 핸들이 노드 경계 바깥에 위치하므로, 작게 만들어야 엣지가 경계에 닿음
const hiddenHandleClassName =
  'w-px! h-px! bg-transparent! border-0! opacity-0! pointer-events-none! transition-all z-[60]!';

export interface HandlesProps {
  isConnectable: boolean;
  hoverDirection: HoverDirection;
}

export function Handles({ isConnectable, hoverDirection }: HandlesProps) {
  const canvasMode = useCanvasModeContext();
  const { readonly } = useCanvasReadOnly();

  // 연결 모드인지 확인
  const isEdgeCreationMode = canvasMode.isEdgeCreationMode();

  // 핸들 표시 조건: 연결 모드이거나 해당 방향에 호버 중
  // readonly 모드에서는 항상 숨김 (하지만 DOM에는 존재해야 edges가 렌더링됨)
  const shouldShowHandle = (direction: 'left' | 'right' | 'top' | 'bottom') => {
    if (readonly) {
      return false; // readonly에서는 항상 숨김 (하지만 handles는 DOM에 존재해야 함)
    }
    return isEdgeCreationMode || hoverDirection === direction;
  };

  return (
    <>
      {/* Left - Source & Target */}
      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
        id="left"
        className={
          shouldShowHandle('left') ? handleClassName : hiddenHandleClassName
        }
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        id="left"
        className={
          shouldShowHandle('left') ? handleClassName : hiddenHandleClassName
        }
      />

      {/* Right - Source & Target */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        id="right"
        className={
          shouldShowHandle('right') ? handleClassName : hiddenHandleClassName
        }
      />
      <Handle
        type="target"
        position={Position.Right}
        isConnectable={isConnectable}
        id="right"
        className={
          shouldShowHandle('right') ? handleClassName : hiddenHandleClassName
        }
      />

      {/* Top - Source & Target */}
      <Handle
        type="source"
        position={Position.Top}
        isConnectable={isConnectable}
        id="top"
        className={
          shouldShowHandle('top') ? handleClassName : hiddenHandleClassName
        }
      />
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        id="top"
        className={
          shouldShowHandle('top') ? handleClassName : hiddenHandleClassName
        }
      />

      {/* Bottom - Source & Target */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        id="bottom"
        className={
          shouldShowHandle('bottom') ? handleClassName : hiddenHandleClassName
        }
      />
      <Handle
        type="target"
        position={Position.Bottom}
        isConnectable={isConnectable}
        id="bottom"
        className={
          shouldShowHandle('bottom') ? handleClassName : hiddenHandleClassName
        }
      />
    </>
  );
}
