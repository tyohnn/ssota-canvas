/**
 * Unsplash Tab Context
 *
 * Context 정의 및 Hook
 */

'use client';

import { createContext, useContext } from 'react';
import type { UnsplashImage } from '@/domains/image-app-space/shared/types/image-search.types';

/**
 * Unsplash Tab Context Value
 */
export interface UnsplashTabContextValue {
  // State
  images: UnsplashImage[];
  searchQuery: string;
  selectedCategory: string | null;
  isLoading: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  handleSearch: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  onSelectImage: (image: UnsplashImage) => void;
}

/**
 * Unsplash Tab Context
 */
export const UnsplashTabContext = createContext<UnsplashTabContextValue | null>(
  null
);

/**
 * Unsplash Tab Context Hook
 */
export function useUnsplashTabContext(): UnsplashTabContextValue {
  const context = useContext(UnsplashTabContext);
  if (!context) {
    throw new Error(
      'useUnsplashTabContext must be used within UnsplashTabContext.Provider'
    );
  }
  return context;
}
