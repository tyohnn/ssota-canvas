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
import { useBaseBlockContext } from '../core/context';
import { useCanvasMode } from '@/domains/canvas-management/frontend/contexts/canvas-mode-context';

// 핸들 크기: w-5 h-5 (20px × 20px)
// 선택 테두리와 동일한 blue-400 색상 사용
const handleClassName =
  'w-4! h-4! bg-blue-400/80! border-2! border-blue-800! dark:bg-blue-400/80! dark:border-blue-800! transition-all z-50!';

// 숨김 상태: 크기를 최소화하여 엣지가 블록 경계에 가깝게 연결되도록 함
// 핸들이 노드 경계 바깥에 위치하므로, 작게 만들어야 엣지가 경계에 닿음
const hiddenHandleClassName =
  'w-px! h-px! bg-transparent! border-0! opacity-0! pointer-events-none! transition-all z-50!';

export function Handles() {
  const { isConnectable, hoverDirection } = useBaseBlockContext();
  const canvasMode = useCanvasMode();

  // 연결 모드인지 확인
  const isEdgeCreationMode = canvasMode.isEdgeCreationMode();

  // 핸들 표시 조건: 연결 모드이거나 해당 방향에 호버 중
  const shouldShowHandle = (direction: 'left' | 'right' | 'top' | 'bottom') => {
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
