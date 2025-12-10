/**
 * Add Button Zones Context
 *
 * Add Button Zones의 상태를 공유하는 컨텍스트
 */

'use client';

import { createContext, useContext } from 'react';
import type { UseAddButtonsUIReturn } from './use-add-buttons.ui';

export const AddButtonZonesContext =
  createContext<UseAddButtonsUIReturn | null>(null);

/**
 * Add Button Zones Context Hook
 *
 * @throws Error if used outside of AddButtonZonesProvider
 */
export function useAddButtonZonesContext() {
  const context = useContext(AddButtonZonesContext);

  if (!context) {
    throw new Error(
      'useAddButtonZonesContext must be used within AddButtonZonesProvider'
    );
  }

  return context;
}
