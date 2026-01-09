/**
 * Block Original Toolbar Hook
 *
 * 메인 훅: 의존성 주입 및 UI/비즈니스 훅 오케스트레이션
 */

'use client';

import type { BlockOriginalToolbarProps } from './types';
import type { UseBlockOriginalToolbarReturn } from './types';
import { useBlockOriginalToolbarBusiness } from './use-block-original-toolbar.business';
import { useBlockOriginalToolbarUI } from './use-block-original-toolbar.ui';

/**
 * Block Original Toolbar Hook
 *
 * UI 훅과 비즈니스 훅을 오케스트레이션하여 통합 로직 제공
 */
export function useBlockOriginalToolbar(
  props: BlockOriginalToolbarProps
): UseBlockOriginalToolbarReturn {
  // UI 훅
  const uiState = useBlockOriginalToolbarUI();

  // 비즈니스 훅
  const business = useBlockOriginalToolbarBusiness(props);

  return {
    uiState,
    business,
  };
}
