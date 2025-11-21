import { useCallback, useEffect } from 'react';
import { useImageSpaceContext } from '../../../../core/image-space.context';
import { useUnsplashTabUI } from './use-unsplash-tab.ui';
import { useUnsplashTabBusiness } from './use-unsplash-tab.business';
import type {
  UnsplashTabBusinessLogic,
  UnsplashTabContextValue,
} from './types';

/**
 * Combined Hook (UI + Business 통합)
 */
export function useUnsplashTab(
  businessLogic?: UnsplashTabBusinessLogic
): UnsplashTabContextValue {
  // Image Space Context
  const { searchQuery, selectedCategory, onSelectImage } =
    useImageSpaceContext();

  // UI State
  const uiState = useUnsplashTabUI();

  // Business Logic
  const defaultBusiness = useUnsplashTabBusiness();
  const business = businessLogic ?? defaultBusiness;

  // Combined: 이미지 로드
  const loadImages = useCallback(
    async (forceRefresh = false) => {
      // 이미 로딩 중이면 중단
      if (uiState.loadingRef.current && !forceRefresh) {
        return;
      }

      uiState.loadingRef.current = true;
      uiState.setIsLoading(true);
      uiState.setError(null); // 에러 초기화

      try {
        const results = await business.loadImages(
          searchQuery,
          selectedCategory,
          forceRefresh
        );
        uiState.setImages(results);
        uiState.setError(null);
      } catch (error) {
        console.error('Failed to load images:', error);
        uiState.setError(
          error instanceof Error ? error.message : 'Failed to load images'
        );
        uiState.setImages([]);
      } finally {
        uiState.setIsLoading(false);
        uiState.loadingRef.current = false;
      }
    },
    [searchQuery, selectedCategory, business, uiState]
  );

  // Combined: 이미지 선택
  const handleSelectImage = useCallback(
    async (image: any) => {
      try {
        await business.handleImageSelect(image, onSelectImage);
      } catch (error) {
        console.error('Failed to select image:', error);
      }
    },
    [business, onSelectImage]
  );

  // 검색어/카테고리 변경 시 로드
  useEffect(() => {
    loadImages();
  }, [searchQuery, selectedCategory]);

  return {
    ...uiState,
    searchQuery,
    selectedCategory,
    setSearchQuery: (query: string) => {},
    setSelectedCategory: (category: string | null) => {},
    handleSearch: async () => {
      await loadImages();
    },
    handleRefresh: async () => {
      await loadImages(true);
    },
    onSelectImage: handleSelectImage,
  };
}
