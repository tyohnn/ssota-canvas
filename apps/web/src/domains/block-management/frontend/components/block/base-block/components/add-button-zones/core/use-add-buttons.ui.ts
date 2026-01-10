/**
 * Add Buttons UI Logic Hook
 *
 * Add Buttons UI 상태 및 표시 로직
 */

'use client';

import { useState } from 'react';
import type { HoverDirection } from './types';

export type AddButtonDirection = Exclude<HoverDirection, null>;

export interface UseAddButtonsUIReturn {
  addButtonHoverDirection: HoverDirection;
  setAddButtonHoverDirection: (direction: HoverDirection) => void;
  showButton: (direction: AddButtonDirection) => boolean;
}

/**
 * Add Buttons UI Logic Hook
 *
 * UI 상태 및 표시 조건만 담당
 */
export function useAddButtonsUI(): UseAddButtonsUIReturn {
  const [addButtonHoverDirection, setAddButtonHoverDirection] =
    useState<HoverDirection>(null);

  // 표시 조건: 단일 선택된 블록 + Add Button hover 방향이 있을 때
  const showButton = (direction: AddButtonDirection) => {
    return addButtonHoverDirection === direction;
  };

  return {
    addButtonHoverDirection,
    setAddButtonHoverDirection,
    showButton,
  };
}
