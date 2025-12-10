/**
 * Add Button Zones Component
 *
 * 블록 바깥 50px 영역에 투명한 hover 영역을 배치하여
 * Add Button의 hover 트리거를 핸들과 분리
 * - E010-003: 블록 추가 + 버튼
 * - selected일 때만 렌더링
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { useBaseBlockContext } from '../../core/use-base-block.context';
import { useAddButtonsBusiness } from './core/use-add-buttons.business';
import { useAddButtonsUI } from './core/use-add-buttons.ui';
import {
  AddButtonZonesContext,
  useAddButtonZonesContext,
} from './core/add-button-zones.context';
import { AddButton } from './add-button';
import type { AddButtonDirection } from './core/use-add-buttons.business';

interface AddButtonZonesContainerProps {
  show: boolean;
}

/**
 * Add Button Zone
 *
 * 각 방향별 zone과 그 안의 버튼을 함께 관리
 */
function AddButtonZone({ direction }: { direction: AddButtonDirection }) {
  const { handleAddBlock } = useAddButtonsBusiness();
  const { addButtonHoverDirection, setAddButtonHoverDirection } =
    useAddButtonZonesContext();
  const { setHoverDirection } = useBaseBlockContext();

  const zoneClasses = {
    left: cn(
      'absolute left-[-20px] top-1/2 -translate-y-1/2',
      'w-7 h-7',
      '-translate-x-full',
      'flex items-center justify-start',
      'pointer-events-auto z-40'
    ),
    right: cn(
      'absolute right-[-20px] top-1/2 -translate-y-1/2',
      'w-7 h-7',
      'translate-x-full',
      'flex items-center justify-end',
      'pointer-events-auto z-40'
    ),
    top: cn(
      'absolute left-1/2 top-[-20px] -translate-x-1/2',
      'w-7 h-7',
      '-translate-y-full',
      'flex items-start justify-center',
      'pointer-events-auto z-40'
    ),
    bottom: cn(
      'absolute left-1/2 bottom-[-20px] -translate-x-1/2',
      'w-7 h-7',
      'flex items-end justify-center',
      'translate-y-full',
      'pointer-events-auto z-40'
    ),
  };

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
      <AddButton
        direction={direction}
        onClick={() => handleAddBlock(direction)}
        isHovered={addButtonHoverDirection === direction}
      />
    </div>
  );
}

/**
 * Add Button Zones Container
 *
 * Zones와 Buttons를 함께 관리하는 컨테이너
 */
export function AddButtonZonesContainer({
  show,
}: AddButtonZonesContainerProps) {
  const uiState = useAddButtonsUI();

  if (!show) {
    return null;
  }

  return (
    <AddButtonZonesContext.Provider value={uiState}>
      <AddButtonZone direction="left" />
      <AddButtonZone direction="right" />
      <AddButtonZone direction="top" />
      <AddButtonZone direction="bottom" />
    </AddButtonZonesContext.Provider>
  );
}
