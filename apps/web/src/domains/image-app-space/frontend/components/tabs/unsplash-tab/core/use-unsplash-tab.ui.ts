import { useState, useCallback, useRef } from 'react';
import type { UnsplashImage } from '@/domains/image-app-space/shared/types/image-search.types';

/**
 * UI State Interface
 */
export interface UnsplashTabUIState {
  // 이미지 상태
  images: UnsplashImage[];
  setImages: (images: UnsplashImage[]) => void;

  // 로딩 상태
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // 에러 상태
  error: string | null;
  setError: (error: string | null) => void;

  // 로딩 참조 (중복 방지)
  loadingRef: React.MutableRefObject<boolean>;
}

/**
 * UI State Hook (노코드 툴용)
 *
 * 특징:
 * - 비즈니스 로직 없음
 * - 로컬 상태만 관리
 * - Framer에서 독립적으로 테스트 가능
 * - API 호출 없음
 */
export function useUnsplashTabUI(): UnsplashTabUIState {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  return {
    images,
    setImages,
    isLoading,
    setIsLoading,
    error,
    setError,
    loadingRef,
  };
}
