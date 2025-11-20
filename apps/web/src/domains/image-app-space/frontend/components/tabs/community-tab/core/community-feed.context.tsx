/**
 * Community Feed Context
 *
 * Frontend Specification 참조: 04-frontend-specification.md
 * Scenario 3: Community Feed 탐색 및 상호작용
 */

'use client';

import { createContext, useContext } from 'react';
import type { ImageAssetWithStats } from '@/domains/image-app-space/backend/repositories/interfaces/image-asset.repository.interface';
import type { ImageCategory } from '@/db/schemas/image-app-space-schema';

/**
 * Feed Sort Type
 */
export type FeedSortType = 'trending' | 'recent' | 'views';

/**
 * Community Feed State
 */
export interface CommunityFeedState {
  // Filters
  sort: FeedSortType;
  category?: ImageCategory;

  // Data
  images: ImageAssetWithStats[];
  isLoading: boolean;
  hasNextPage: boolean;
  page: number;
}

/**
 * Community Feed Actions
 */
export interface CommunityFeedActions {
  // Filters
  setSort: (sort: FeedSortType) => void;
  setCategory: (category?: ImageCategory) => void;

  // Pagination
  fetchNextPage: () => void;

  // Interactions
  toggleLike: (imageAssetId: string) => Promise<void>;
  toggleBookmark: (imageAssetId: string) => Promise<void>;
  recordView: (imageAssetId: string) => Promise<void>;
}

/**
 * Community Feed Context Value
 */
export interface CommunityFeedContextValue
  extends CommunityFeedState,
    CommunityFeedActions {}

/**
 * Community Feed Context
 */
export const CommunityFeedContext =
  createContext<CommunityFeedContextValue | null>(null);

/**
 * Community Feed Context Hook
 */
export function useCommunityFeedContext(): CommunityFeedContextValue {
  const context = useContext(CommunityFeedContext);
  if (!context) {
    throw new Error(
      'useCommunityFeedContext must be used within CommunityFeedProvider'
    );
  }
  return context;
}
