/**
 * Following Feed Context
 *
 * Process Model: Scenario 5 - 팔로잉 피드 조회
 */

'use client';

import { createContext, useContext } from 'react';
import type { ImageAssetWithStats } from '@/domains/image-app-space/backend/repositories/interfaces/image-asset.repository.interface';

/**
 * Following Feed State
 */
export interface FollowingFeedState {
  images: ImageAssetWithStats[];
  isLoading: boolean;
  hasNextPage: boolean;
  hasFollowing: boolean; // 팔로우 관계 존재 여부
}

/**
 * Following Feed Actions
 */
export interface FollowingFeedActions {
  fetchNextPage: () => void;
  toggleLike: (imageAssetId: string) => Promise<void>;
  toggleBookmark: (imageAssetId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
}

/**
 * Following Feed Context Value
 */
export interface FollowingFeedContextValue
  extends FollowingFeedState,
    FollowingFeedActions {}

export const FollowingFeedContext =
  createContext<FollowingFeedContextValue | null>(null);

export function useFollowingFeedContext(): FollowingFeedContextValue {
  const context = useContext(FollowingFeedContext);
  if (!context) {
    throw new Error(
      'useFollowingFeedContext must be used within FollowingFeedProvider'
    );
  }
  return context;
}
