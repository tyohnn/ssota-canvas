/**
 * Ssota Tab Hook (통합)
 *
 * UI + Business 로직 통합
 */

'use client';

import { useCallback, useEffect } from 'react';
import { useImageSpaceContext } from '@/domains/image-app-space/frontend/core/image-space.context';
import { useSsotaTabUI } from './use-ssota-tab.ui';
import { useSsotaTabBusiness } from './use-ssota-tab.business';
import type { SsotaTabContextValue } from './ssota-tab.context';

/**
 * Ssota Tab Hook
 */
export function useSsotaTab(): SsotaTabContextValue {
  const { searchQuery } = useImageSpaceContext();

  // UI State
  const uiState = useSsotaTabUI();

  // Business Logic
  const business = useSsotaTabBusiness();

  // Handle Search
  const handleSearch = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      uiState.clearImages();
      return;
    }

    uiState.setIsLoading(true);
    try {
      const results = await business.searchImages(searchQuery);
      uiState.setImages(results);
    } finally {
      uiState.setIsLoading(false);
    }
  }, [searchQuery, business, uiState]);

  // Auto search when query changes
  useEffect(() => {
    handleSearch();
  }, [searchQuery]);

  return {
    // State
    images: uiState.images,
    searchQuery,
    isLoading: uiState.isLoading,

    // Actions
    setSearchQuery: () => {}, // Controlled by ImageSpaceContext
    handleSearch,
    onSelectImage: business.onSelectImage,
  };
}
