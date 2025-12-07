import { useCallback } from 'react';
import type { UnsplashImage } from '@/domains/image-app-space/shared/types/image-search.types';
import {
  searchUnsplashImagesAction,
  trackUnsplashDownloadAction,
} from '@/domains/image-app-space/actions/image-search.actions';
import { createOrGetUnsplashImageAssetAction } from '@/domains/image-app-space/actions/image-asset.actions';
import { isFailure } from '@/lib/action-result';
import { imageCache, getCacheKey } from './cache';
import { CATEGORY_MAP } from './constants';
import type { UnsplashTabBusinessLogic } from './types';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';

/**
 * Production 비즈니스 로직
 */
export function useUnsplashTabBusiness(): UnsplashTabBusinessLogic {
  const { selectedWorkspaceId } = useWorkspace();

  const loadImages = useCallback(
    async (
      searchQuery: string,
      selectedCategory: string | null,
      forceRefresh = false
    ): Promise<UnsplashImage[]> => {
      const categoryQuery = selectedCategory
        ? CATEGORY_MAP[selectedCategory as keyof typeof CATEGORY_MAP]
        : undefined;
      const cacheKey = getCacheKey(searchQuery, categoryQuery);

      // 캐시 확인 (강제 새로고침이 아닌 경우)
      if (!forceRefresh) {
        const cachedImages = imageCache.get(cacheKey);
        if (cachedImages && cachedImages.length > 0) {
          return cachedImages;
        }
      }

      // Server Action 호출
      const result = await searchUnsplashImagesAction(
        searchQuery,
        categoryQuery
      );

      if (isFailure(result)) {
        console.error('Failed to fetch Unsplash images:', result.error);
        // API 키 에러인 경우 throw해서 UI에서 처리
        if (
          result.error.includes('API key') ||
          result.error.includes('UNSPLASH')
        ) {
          throw new Error(result.error);
        }
        return [];
      }

      const results = result.data;

      // 중복 제거 (이미지 ID 기준)
      const uniqueResults = Array.from(
        new Map(results.map(img => [img.id, img])).values()
      );

      // 캐시에 저장
      imageCache.set(cacheKey, uniqueResults);

      return uniqueResults;
    },
    []
  );

  const handleImageSelect = useCallback(
    async (
      image: UnsplashImage,
      onSelectImage: (params: any) => Promise<void>
    ) => {
      if (!selectedWorkspaceId) {
        console.error('[UnsplashTab] No workspace selected');
        return;
      }

      // Unsplash 다운로드 트래킹 (백그라운드)
      trackUnsplashDownloadAction(image.id).catch(err =>
        console.warn('Tracking failed:', err)
      );

      try {
        // ✅ 1. image_assets에 저장 (중복 체크 포함)
        const result = await createOrGetUnsplashImageAssetAction({
          photoId: image.id,
          imageUrl: image.urls.regular,
          width: image.width,
          height: image.height,
          authorName: image.user.name,
          authorUsername: image.user.name, // username이 없으면 name 사용
          authorLink: `${image.user.links.html}?utm_source=ssota&utm_medium=referral`,
          altDescription: image.alt_description || undefined,
          workspaceId: selectedWorkspaceId,
        });

        if (!result.success) {
          console.error(
            '[UnsplashTab] Failed to save to image_assets:',
            result.error
          );
          // Fallback to legacy
          await onSelectImage({
            imageUrl: image.urls.regular,
            source: 'unsplash',
            metadata: {
              unsplashAuthorName: image.user.name,
              unsplashAuthorLink: `${image.user.links.html}?utm_source=ssota&utm_medium=referral`,
              caption: `Photo by ${image.user.name} on Unsplash`,
              alt: image.alt_description || undefined,
            },
          });
          return;
        }

        // ✅ 2. imageAssetId로 블록 업데이트
        await onSelectImage({
          imageUrl: result.data.image_url, // 참고용 (실제로는 캐시로 사용)
          source: 'unsplash',
          metadata: {
            imageAssetId: result.data.id, // ✅ 핵심: imageAssetId 전달
            unsplashAuthorName: image.user.name,
            unsplashAuthorLink: `${image.user.links.html}?utm_source=ssota&utm_medium=referral`,
            alt: image.alt_description || undefined,
          },
        });
      } catch (error) {
        console.error('[UnsplashTab] Error in handleImageSelect:', error);
        // Fallback
        await onSelectImage({
          imageUrl: image.urls.regular,
          source: 'unsplash',
          metadata: {
            unsplashAuthorName: image.user.name,
            unsplashAuthorLink: `${image.user.links.html}?utm_source=ssota&utm_medium=referral`,
            caption: `Photo by ${image.user.name} on Unsplash`,
            alt: image.alt_description || undefined,
          },
        });
      }
    },
    [selectedWorkspaceId]
  );

  return {
    loadImages,
    handleImageSelect,
  } as UnsplashTabBusinessLogic;
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 */
export function useMockUnsplashTabBusiness(): UnsplashTabBusinessLogic {
  const loadImages = useCallback(async () => {
    console.log('[Mock] Loading images');
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  }, []);

  const handleImageSelect = useCallback(async () => {
    console.log('[Mock] Selecting image');
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  return {
    loadImages,
    handleImageSelect,
  } as UnsplashTabBusinessLogic;
}
