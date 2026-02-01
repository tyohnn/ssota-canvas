/**
 * Handles Component
 *
 * Container Component: Hook → Props 변환
 * 상하좌우 연결점 (Connection Handles)
 * - 각 위치에 source와 target Handle 모두 배치
 * - source: 이 노드에서 엣지가 시작
 * - target: 이 노드에서 엣지가 끝남
 * - E010-002: 기본 숨김, 호버 시 또는 연결 모드에서만 표시
 */

'use client';

import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import type { HoverDirection } from '../core/types';
import { HandlesView } from './handles.view';

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
    <HandlesView
      isConnectable={isConnectable}
      showLeft={shouldShowHandle('left')}
      showRight={shouldShowHandle('right')}
      showTop={shouldShowHandle('top')}
      showBottom={shouldShowHandle('bottom')}
    />
  );
}
