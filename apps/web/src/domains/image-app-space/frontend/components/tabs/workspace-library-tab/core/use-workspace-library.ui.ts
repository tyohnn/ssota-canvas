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
  const [selectedImageForSettings, setSelectedImageForSettings] =
    useState<ImageAsset | null>(null);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  const openImageSettings = useCallback((image: ImageAsset) => {
    setSelectedImageForSettings(image);
  }, []);

  const closeImageSettings = useCallback(() => {
    setSelectedImageForSettings(null);
  }, []);

  return {
    // State
    images,
    isLoading,
    filterType,
    selectedImageForSettings,

    // Actions
    setImages,
    setIsLoading,
    setFilterType,
    clearImages,
    openImageSettings,
    closeImageSettings,
  };
}
