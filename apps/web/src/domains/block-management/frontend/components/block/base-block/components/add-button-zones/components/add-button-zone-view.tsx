/**
 * Add Button Zone View Component
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 * - Storybook에서 독립적으로 테스트 가능
 */

'use client';

import { cn } from '@workspace/ui/lib/utils';

import type { HoverDirection } from '../core/types';
import type { AddButtonDirection } from '../core/use-add-buttons.business';
import { AddButtonView } from './add-button-view';

export interface AddButtonZoneViewProps {
  direction: AddButtonDirection;
  addButtonHoverDirection: HoverDirection;
  setAddButtonHoverDirection: (direction: HoverDirection) => void;
  setHoverDirection: (direction: HoverDirection | null) => void;
  onAddBlock: (direction: AddButtonDirection) => void;
}

/**
 * Add Button Zone View
 *
 * 각 방향별 zone과 그 안의 버튼을 함께 관리
 */
export function AddButtonZoneView({
  direction,
  addButtonHoverDirection,
  setAddButtonHoverDirection,
  setHoverDirection,
  onAddBlock,
}: AddButtonZoneViewProps) {
  const zoneClasses = {
    left: cn(
      'absolute left-[-20px] top-1/2 -translate-y-1/2',
      'w-8 h-8',
      '-translate-x-full',
      'flex items-center justify-start',
      'pointer-events-auto z-40'
    ),
    right: cn(
      'absolute right-[-10px] top-1/2 -translate-y-1/2',
      'w-8 h-8',
      'translate-x-full',
      'flex items-center justify-end',
      'pointer-events-auto z-40'
      // 테스팅용 빨간색 배경
      // 'bg-red-500/50'
    ),
    top: cn(
      'absolute left-1/2 top-[-20px] -translate-x-1/2',
      'w-8 h-8',
      '-translate-y-full',
      'flex items-start justify-center',
      'pointer-events-auto z-40'
    ),
    bottom: cn(
      'absolute left-1/2 bottom-[-10px] -translate-x-1/2',
      'w-8 h-8',
      'flex items-end justify-center',
      'translate-y-full',
      'pointer-events-auto z-40'
      // 테스팅용 빨간색 배경
      // 'bg-red-500/50'
    ),
  };

  const isHovered = addButtonHoverDirection === direction;
  // right와 bottom 방향은 호버 시에만 버튼 표시
  const shouldShowButton = isHovered;

  return (
    <div
      className={cn(zoneClasses[direction])}
      onMouseEnter={() => {
        // 블록의 핸들 hover 방향 초기화
        setHoverDirection(null);
        // Add Button hover 방향 설정
        setAddButtonHoverDirection(direction);
      }}
      onMouseMove={e => {
        e.stopPropagation(); // 이벤트 전파 방지
        setHoverDirection(null);
      }}
      onMouseLeave={() => {
        setAddButtonHoverDirection(null);
      }}
    >
      {shouldShowButton && (
        <AddButtonView
          direction={direction}
          onClick={() => onAddBlock(direction)}
          isHovered={isHovered}
        />
      )}
    </div>
  );
}
