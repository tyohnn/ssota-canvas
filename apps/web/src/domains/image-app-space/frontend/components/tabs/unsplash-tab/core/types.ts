/**
 * Unsplash Tab Types
 */

import type { UnsplashImage } from '@/domains/image-app-space/shared/types/image-search.types';

// Re-export for convenience
export type { UnsplashImage };

/**
 * Unsplash Tab Props
 */
export interface UnsplashTabProps {
  className?: string;
  businessLogic?: UnsplashTabBusinessLogic;
}

/**
 * Unsplash Tab Business Logic Interface
 */
export interface UnsplashTabBusinessLogic {
  loadImages: (
    searchQuery: string,
    selectedCategory: string | null,
    forceRefresh?: boolean
  ) => Promise<UnsplashImage[]>;
  handleImageSelect: (image: UnsplashImage, onSelect: any) => Promise<void>;
}

/**
 * Unsplash Tab Context Value
 */
export interface UnsplashTabContextValue {
  // State
  images: UnsplashImage[];
  searchQuery: string;
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  handleSearch: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  onSelectImage: (image: UnsplashImage) => void;
}

/**
 * Unsplash Cache Interface
 */
export interface IUnsplashCache {
  get: (key: string) => UnsplashImage[] | undefined;
  set: (key: string, images: UnsplashImage[]) => void;
  clear: () => void;
}

/**
 * Category Mapping
 */
export type CategoryKey =
  | 'all'
  | 'nature'
  | 'architecture'
  | 'people'
  | 'animals'
  | 'technology'
  | 'food'
  | 'travel'
  | 'business'
  | 'abstract';

export type CategoryMapping = Record<CategoryKey, string>;
