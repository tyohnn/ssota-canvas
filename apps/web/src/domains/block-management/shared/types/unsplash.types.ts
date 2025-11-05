/**
 * Unsplash API Types
 *
 * Unsplash API 응답에 대한 타입 정의
 * API 문서: https://unsplash.com/documentation
 */

/**
 * Unsplash 이미지 정보
 */
export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

/**
 * Unsplash 검색 API 응답
 */
export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}
