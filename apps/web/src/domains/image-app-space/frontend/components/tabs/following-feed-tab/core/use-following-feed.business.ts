/**
 * Following Feed Business Logic
 */

'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';
import { browseFollowingFeedAction } from '@/domains/image-app-space/actions/image-asset.actions';
import {
  toggleLikeAction,
  toggleBookmarkAction,
  toggleFollowAction,
} from '@/domains/image-app-space/actions/community-interaction.actions';
import type { ImageAssetWithStats } from '@/domains/image-app-space/backend/repositories/interfaces/image-asset.repository.interface';

export function useFollowingFeedBusiness() {
  const queryClient = useQueryClient();

  // Infinite Query for Following Feed
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['following-feed'],
      queryFn: async ({ pageParam = 1 }) => {
        const result = await browseFollowingFeedAction({
          page: pageParam,
          perPage: 20,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        return {
          images: result.data,
          nextPage: result.data.length === 20 ? pageParam + 1 : undefined,
        };
      },
      getNextPageParam: lastPage => lastPage.nextPage,
      initialPageParam: 1,
    });

  const images: ImageAssetWithStats[] =
    data?.pages.flatMap(page => page.images) ?? [];

  // 팔로우 관계 존재 여부
  const hasFollowing = images.length > 0 || isLoading;

  // Like Mutation
  const likeMutation = useMutation({
    mutationFn: async (imageAssetId: string) => {
      const result = await toggleLikeAction({ imageAssetId });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-feed'] });
    },
  });

  // Bookmark Mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (imageAssetId: string) => {
      const result = await toggleBookmarkAction({ imageAssetId });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-feed'] });
    },
  });

  // Follow Mutation
  const followMutation = useMutation({
    mutationFn: async (followeeId: string) => {
      const result = await toggleFollowAction({ followeeId });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-feed'] });
    },
  });

  const toggleLike = useCallback(
    async (imageAssetId: string) => {
      await likeMutation.mutateAsync(imageAssetId);
    },
    [likeMutation]
  );

  const toggleBookmark = useCallback(
    async (imageAssetId: string) => {
      await bookmarkMutation.mutateAsync(imageAssetId);
    },
    [bookmarkMutation]
  );

  const toggleFollow = useCallback(
    async (userId: string) => {
      await followMutation.mutateAsync(userId);
    },
    [followMutation]
  );

  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    images,
    isLoading,
    hasNextPage: hasNextPage ?? false,
    hasFollowing,
    fetchNextPage: handleFetchNextPage,
    toggleLike,
    toggleBookmark,
    toggleFollow,
  };
}
