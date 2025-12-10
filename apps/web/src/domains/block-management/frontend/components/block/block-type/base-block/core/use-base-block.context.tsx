/**
 * Base Block Context
 *
 * BaseBlock 컴포넌트의 상태를 서브 컴포넌트와 공유
 */

'use client';

import { createContext, useContext } from 'react';
import type { BaseBlockContextValue } from './types';

export const BaseBlockContext = createContext<BaseBlockContextValue | null>(
  null
);

/**
 * BaseBlock Context Hook
 *
 * @throws Error if used outside of BaseBlock Provider
 */
export function useBaseBlockContext() {
  const context = useContext(BaseBlockContext);

  if (!context) {
    throw new Error(
      'useBaseBlockContext must be used within BaseBlock Provider'
    );
  }

  return context;
}
