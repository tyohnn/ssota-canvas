/**
 * Community Feed UI Logic
 *
 * UI 상태 관리 (로컬 상태)
 */

'use client';

import { useState, useCallback } from 'react';
import type { FeedSortType } from './community-feed.context';
import type { ImageCategory } from '@/db/schemas/image-app-space-schema';

/**
 * UI State
 */
export interface CommunityFeedUIState {
  sort: FeedSortType;
  category?: ImageCategory;
  page: number;
}

/**
 * UI Actions
 */
export interface CommunityFeedUIActions {
  setSort: (sort: FeedSortType) => void;
  setCategory: (category?: ImageCategory) => void;
  incrementPage: () => void;
  resetPage: () => void;
}

/**
 * Community Feed UI Hook
 *
 * 로컬 상태 관리 (필터, 페이지)
 */
export function useCommunityFeedUI() {
  const [sort, setSort] = useState<FeedSortType>('trending');
  const [category, setCategory] = useState<ImageCategory | undefined>(
    undefined
  );
  const [page, setPage] = useState(1);

  const handleSetSort = useCallback((newSort: FeedSortType) => {
    setSort(newSort);
    setPage(1); // 정렬 변경 시 페이지 리셋
  }, []);

  const handleSetCategory = useCallback((newCategory?: ImageCategory) => {
    setCategory(newCategory);
    setPage(1); // 카테고리 변경 시 페이지 리셋
  }, []);

  const incrementPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    // State
    sort,
    category,
    page,

    // Actions
    setSort: handleSetSort,
    setCategory: handleSetCategory,
    incrementPage,
    resetPage,
  };
}
