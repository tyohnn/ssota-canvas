/**
 * Workspace Library UI Logic
 */

'use client';

import { useState, useCallback } from 'react';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';

/**
 * Workspace Library UI Hook
 */
export function useWorkspaceLibraryUI() {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<
    'all' | 'ai-generated' | 'unsplash' | 'user-upload'
  >('all');

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    // State
    images,
    isLoading,
    filterType,

    // Actions
    setImages,
    setIsLoading,
    setFilterType,
    clearImages,
  };
}
