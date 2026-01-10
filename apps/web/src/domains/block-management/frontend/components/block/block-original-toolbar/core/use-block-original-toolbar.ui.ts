/**
 * Block Original Toolbar UI Hook
 *
 * UI 상태 관리 및 UI 관련 로직
 */

'use client';

import { useRef } from 'react';

import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks';

import type { BlockOriginalToolbarUIState } from './types';

/**
 * Block Original Toolbar UI Hook
 *
 * UI 상태 관리만 담당
 * - toolbarRef 관리
 * - 트랙패드 핀치 줌 방지
 */
export function useBlockOriginalToolbarUI(): BlockOriginalToolbarUIState {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 트랙패드 핀치 줌 방지
  usePreventPinchZoom(toolbarRef);

  return {
    toolbarRef,
  };
}
