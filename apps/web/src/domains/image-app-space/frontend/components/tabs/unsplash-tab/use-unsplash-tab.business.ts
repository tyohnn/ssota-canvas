import { useCallback } from 'react';
import { useImageSpaceContext } from '../../../core/image-space.context';
import type { UnsplashImage, CategoryKey } from './types';
import { getCacheKey, imageCache } from './utils';
import { searchUnsplashImagesAction } from '@/domains/image-app-space/actions/image-search.actions';
import { isFailure } from '@/lib/action-result';

/**
 * 카테고리 매핑 (영문)
 */
const CATEGORY_MAP: Record<CategoryKey, string> = {
  all: '',
  nature: 'nature',
  architecture: 'architecture',
  people: 'people',
  animals: 'animals',
  technology: 'technology',
  food: 'food',
  travel: 'travel',
  business: 'business',
  abstract: 'abstract',
};

/**
 * Business Logic Interface
 */
export interface UnsplashTabBusinessLogic {
  loadImages: (forceRefresh?: boolean) => Promise<UnsplashImage[]>;
  selectImage: (image: UnsplashImage) => Promise<void>;
}

/**
 * Unsplash API 호출 (Server Action 사용)
 */
async function fetchUnsplashImages(
  query?: string,
  category?: string
): Promise<UnsplashImage[]> {
  try {
    const result = await searchUnsplashImagesAction(query, category);

    if (isFailure(result)) {
      console.error('Failed to fetch Unsplash images:', result.error);
      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Failed to fetch Unsplash images:', error);
    return [];
  }
}

/**
 * Production 비즈니스 로직
 */
export function useUnsplashTabBusiness(): UnsplashTabBusinessLogic {
  const { searchQuery, selectedCategory, onSelectImage } =
    useImageSpaceContext();

  /**
   * 이미지 로드 (캐시 사용)
   */
  const loadImages = useCallback(
    async (forceRefresh = false): Promise<UnsplashImage[]> => {
      const categoryQuery = selectedCategory
        ? CATEGORY_MAP[selectedCategory as CategoryKey]
        : undefined;
      const cacheKey = getCacheKey(searchQuery, categoryQuery);

      // 캐시 확인 (강제 새로고침이 아닌 경우)
      if (!forceRefresh) {
        const cachedImages = imageCache.get(cacheKey);
        if (cachedImages && cachedImages.length > 0) {
          return cachedImages;
        }
      }

      // API 호출
      const results = await fetchUnsplashImages(searchQuery, categoryQuery);

      // 중복 제거 (이미지 ID 기준)
      const uniqueResults = Array.from(
        new Map(results.map(img => [img.id, img])).values()
      );

      // 캐시에 저장
      imageCache.set(cacheKey, uniqueResults);
      return uniqueResults;
    },
    [searchQuery, selectedCategory]
  );

  /**
   * 이미지 선택 핸들러
   */
  const selectImage = useCallback(
    async (image: UnsplashImage): Promise<void> => {
      try {
        const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
        if (accessKey) {
          // Unsplash 다운로드 엔드포인트 트리거 (백그라운드)
          fetch(
            `https://api.unsplash.com/photos/${image.id}/download?client_id=${accessKey}`
          ).catch(err =>
            console.warn('Unsplash download tracking failed:', err)
          );
        }

        // Space의 onSelectImage 호출 (Dialog 자동으로 닫힘)
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
      } catch (error) {
        console.error('Failed to select Unsplash image:', error);
        throw error;
      }
    },
    [onSelectImage]
  );

  return {
    loadImages,
    selectImage,
  };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 */
export function useMockUnsplashTabBusiness(): UnsplashTabBusinessLogic {
  const loadImages = useCallback(async (): Promise<UnsplashImage[]> => {
    console.log('[Mock] Loading Unsplash images...');
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  }, []);

  const selectImage = useCallback(
    async (image: UnsplashImage): Promise<void> => {
      console.log('[Mock] Selecting Unsplash image:', image.id);
      await new Promise(resolve => setTimeout(resolve, 300));
    },
    []
  );

  return {
    loadImages,
    selectImage,
  };
}
