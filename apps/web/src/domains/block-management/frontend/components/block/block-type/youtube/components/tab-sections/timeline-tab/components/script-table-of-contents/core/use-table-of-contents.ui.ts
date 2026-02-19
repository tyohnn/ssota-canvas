/**
 * Use Table of Contents UI Hook
 *
 * 목차 컴포넌트의 UI 상태를 관리합니다.
 */

'use client';

import { useState } from 'react';

import type { TableOfContentsUIState } from './types';

/**
 * Use Table of Contents UI Hook
 *
 * 호버 상태를 관리합니다.
 *
 * @returns UI 상태
 */
export function useTableOfContentsUI(): TableOfContentsUIState {
  const [isHovered, setIsHovered] = useState(false);

  return {
    isHovered,
    setIsHovered,
  };
}
