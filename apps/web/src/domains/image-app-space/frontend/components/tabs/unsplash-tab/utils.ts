import type { UnsplashImage } from './types';

/**
 * 캐시 키 생성
 */
export function getCacheKey(query?: string, category?: string): string {
  return `unsplash:${query || 'random'}:${category || 'all'}`;
}

/**
 * 이미지 캐시 (전역 - 모든 블록에서 공유)
 * localStorage를 사용하여 브라우저 세션 간에도 유지
 */
export class UnsplashCache {
  private memoryCache = new Map<string, UnsplashImage[]>();
  private readonly STORAGE_KEY = 'unsplash_image_cache';
  private readonly MAX_CACHE_SIZE = 50; // 최대 50개 쿼리 캐싱

  get(key: string): UnsplashImage[] | undefined {
    // 메모리 캐시 확인
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // localStorage 확인
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const cache = JSON.parse(stored) as Record<string, UnsplashImage[]>;
        if (cache[key]) {
          // 메모리 캐시에도 저장
          this.memoryCache.set(key, cache[key]);
          return cache[key];
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    return undefined;
  }

  set(key: string, value: UnsplashImage[]): void {
    // 메모리 캐시에 저장
    this.memoryCache.set(key, value);

    // localStorage에 저장
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const cache: Record<string, UnsplashImage[]> = stored
        ? JSON.parse(stored)
        : {};

      cache[key] = value;

      // 캐시 크기 제한 (오래된 것부터 삭제)
      const keys = Object.keys(cache);
      if (keys.length > this.MAX_CACHE_SIZE) {
        const keysToDelete = keys.slice(0, keys.length - this.MAX_CACHE_SIZE);
        keysToDelete.forEach(k => delete cache[k]);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to write to localStorage:', error);
    }
  }

  clear(): void {
    this.memoryCache.clear();
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
}

// 전역 캐시 인스턴스
export const imageCache = new UnsplashCache();


