/**
 * Ssota Tab UI Logic
 *
 * UI 상태 관리
 */

'use client';

import { useState, useCallback } from 'react';
import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';

/**
 * Ssota Tab UI Hook
 */
export function useSsotaTabUI() {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    // State
    images,
    isLoading,

    // Actions
    setImages,
    setIsLoading,
    clearImages,
  };
}
