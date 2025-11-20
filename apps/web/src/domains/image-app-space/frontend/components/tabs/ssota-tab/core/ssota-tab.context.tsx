/**
 * Ssota Tab Context
 *
 * 시맨틱 검색 기반 이미지 탐색
 */

'use client';

import { createContext, useContext } from 'react';
import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';

/**
 * Ssota Tab Context Value
 */
export interface SsotaTabContextValue {
  // State
  images: ImageAsset[];
  searchQuery: string;
  isLoading: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  handleSearch: () => Promise<void>;
  onSelectImage: (image: ImageAsset) => void;
}

/**
 * Ssota Tab Context
 */
export const SsotaTabContext = createContext<SsotaTabContextValue | null>(null);

/**
 * Ssota Tab Context Hook
 */
export function useSsotaTabContext(): SsotaTabContextValue {
  const context = useContext(SsotaTabContext);
  if (!context) {
    throw new Error(
      'useSsotaTabContext must be used within SsotaTabContext.Provider'
    );
  }
  return context;
}
