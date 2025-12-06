/**
 * Image Toolbar Context
 *
 * Toolbar 아이템들이 공유하는 상태와 액션
 */

'use client';

import { createContext, useContext } from 'react';
import type { ImageToolbarContextValue } from './types';

/**
 * Image Toolbar Context
 */
export const ImageToolbarContext =
  createContext<ImageToolbarContextValue | null>(null);

/**
 * Image Toolbar Context Hook
 *
 * @throws Error if used outside of ImageToolbarProvider
 */
export function useImageToolbarContext(): ImageToolbarContextValue {
  const context = useContext(ImageToolbarContext);
  
  if (!context) {
    throw new Error(
      'useImageToolbarContext must be used within ImageToolbarProvider'
    );
  }
  
  return context;
}


