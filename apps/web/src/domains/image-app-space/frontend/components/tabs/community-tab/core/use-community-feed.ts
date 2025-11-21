/**
 * Community Feed Hook (통합)
 *
 * UI + Business 로직 통합
 */

'use client';

import type { CommunityFeedContextValue } from './community-feed.context';
import { useCommunityFeedUI } from './use-community-feed.ui';
import { useCommunityFeedBusiness } from './use-community-feed.business';

/**
 * Community Feed Hook (통합)
 *
 * UI Hook + Business Hook 조합
 */
export function useCommunityFeed(): CommunityFeedContextValue {
  // UI State
  const uiState = useCommunityFeedUI();

  // Business Logic
  const businessLogic = useCommunityFeedBusiness(
    uiState.sort,
    uiState.category
  );

  return {
    // State
    sort: uiState.sort,
    category: uiState.category,
    page: uiState.page,
    images: businessLogic.images,
    isLoading: businessLogic.isLoading,
    hasNextPage: businessLogic.hasNextPage,

    // Actions
    setSort: uiState.setSort,
    setCategory: uiState.setCategory,
    fetchNextPage: businessLogic.fetchNextPage,
    toggleLike: businessLogic.toggleLike,
    toggleBookmark: businessLogic.toggleBookmark,
    recordView: businessLogic.recordView,
  };
}
