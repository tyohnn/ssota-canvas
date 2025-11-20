/**
 * Community Feed Business Logic
 *
 * Server Actions 연동 및 비즈니스 로직
 */

'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';
import { browseCommunityFeedAction } from '@/domains/image-app-space/actions/image-asset.actions';
import {
  toggleLikeAction,
  toggleBookmarkAction,
  recordImageViewAction,
} from '@/domains/image-app-space/actions/community-interaction.actions';
import type { ImageAssetWithStats } from '@/domains/image-app-space/backend/repositories/interfaces/image-asset.repository.interface';
import type { FeedSortType } from './community-feed.context';
import type { ImageCategory } from '@/db/schemas/image-app-space-schema';

/**
 * Community Feed Business Logic
 */
export function useCommunityFeedBusiness(
  sort: FeedSortType,
  category?: ImageCategory
) {
  const queryClient = useQueryClient();

  // Infinite Query for Community Feed
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['community-feed', sort, category],
      queryFn: async ({ pageParam = 1 }) => {
        const result = await browseCommunityFeedAction({
          sort,
          category,
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

  // Flatten pages into single array
  const images: ImageAssetWithStats[] =
    data?.pages.flatMap(page => page.images) ?? [];

  // Like Mutation with Optimistic Update
  const likeMutation = useMutation({
    mutationFn: async (imageAssetId: string) => {
      const result = await toggleLikeAction({ imageAssetId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async imageAssetId => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['community-feed', sort, category],
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData([
        'community-feed',
        sort,
        category,
      ]);

      // Optimistically update
      queryClient.setQueryData(
        ['community-feed', sort, category],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              images: page.images.map((img: ImageAssetWithStats) =>
                img.id === imageAssetId
                  ? {
                      ...img,
                      isLiked: !img.isLiked,
                      like_count: img.isLiked
                        ? img.like_count - 1
                        : img.like_count + 1,
                    }
                  : img
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['community-feed', sort, category],
          context.previousData
        );
      }
      console.error('Failed to toggle like:', err);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: ['community-feed', sort, category],
      });
    },
  });

  // Bookmark Mutation with Optimistic Update
  const bookmarkMutation = useMutation({
    mutationFn: async (imageAssetId: string) => {
      const result = await toggleBookmarkAction({ imageAssetId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async imageAssetId => {
      await queryClient.cancelQueries({
        queryKey: ['community-feed', sort, category],
      });

      const previousData = queryClient.getQueryData([
        'community-feed',
        sort,
        category,
      ]);

      queryClient.setQueryData(
        ['community-feed', sort, category],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              images: page.images.map((img: ImageAssetWithStats) =>
                img.id === imageAssetId
                  ? {
                      ...img,
                      isBookmarked: !img.isBookmarked,
                      bookmark_count: img.isBookmarked
                        ? img.bookmark_count - 1
                        : img.bookmark_count + 1,
                    }
                  : img
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['community-feed', sort, category],
          context.previousData
        );
      }
      console.error('Failed to toggle bookmark:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['community-feed', sort, category],
      });
    },
  });

  // Toggle Like
  const toggleLike = useCallback(
    async (imageAssetId: string) => {
      await likeMutation.mutateAsync(imageAssetId);
    },
    [likeMutation]
  );

  // Toggle Bookmark
  const toggleBookmark = useCallback(
    async (imageAssetId: string) => {
      await bookmarkMutation.mutateAsync(imageAssetId);
    },
    [bookmarkMutation]
  );

  // Record View
  const recordView = useCallback(async (imageAssetId: string) => {
    // Silent fail - 조회수는 중요하지 않음
    try {
      await recordImageViewAction(imageAssetId);
    } catch (error) {
      console.warn('Failed to record view:', error);
    }
  }, []);

  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    // Data
    images,
    isLoading,
    hasNextPage: hasNextPage ?? false,

    // Actions
    fetchNextPage: handleFetchNextPage,
    toggleLike,
    toggleBookmark,
    recordView,
  };
}
