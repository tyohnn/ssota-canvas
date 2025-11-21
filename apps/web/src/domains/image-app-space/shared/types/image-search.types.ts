/**
 * Image Search Types
 *
 * SSOTA Image Vault + Unsplash 통합 검색을 위한 타입 정의
 *
 * ⚠️ Migrated from block-management domain to image-app-space domain
 */

/**
 * 이미지 소스 타입
 */
export type ImageSource = 'ssota' | 'unsplash';

/**
 * 검색 타입
 */
export type SearchType = 'keyword' | 'semantic' | 'combined';

/**
 * Unsplash Image (from Unsplash API)
 */
export interface UnsplashImage {
  id: string;
  alt_description: string | null;
  description: string | null;
  width: number;
  height: number;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

/**
 * Unsplash Search Response
 */
export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

/**
 * 이미지 에셋 인터페이스
 *
 * SSOTA와 Unsplash 이미지를 통합하여 표현
 */
export interface ImageAsset {
  /** 고유 ID (source:id 형식) */
  id: string;

  /** 이미지 URL (원본) */
  url: string;

  /** 썸네일 URL */
  thumbnailUrl: string;

  /** Alt 텍스트 */
  alt?: string;

  /** 이미지 소스 */
  source: ImageSource;

  /** 메타데이터 */
  metadata: ImageAssetMetadata;

  /** 검색 스코어 (병합 시 사용) */
  score?: number;
}

/**
 * 이미지 에셋 메타데이터
 *
 * 소스에 따라 다른 정보를 포함
 */
export interface ImageAssetMetadata {
  // SSOTA 이미지
  blockId?: string;
  createdAt?: Date;
  workspaceId?: string;

  // Unsplash 이미지
  authorName?: string;
  authorLink?: string;
  unsplashId?: string;
  downloadLocation?: string;

  // 공통
  width?: number;
  height?: number;
  description?: string;
}

/**
 * 검색 파라미터
 */
export interface SearchParams {
  /** 검색 쿼리 */
  query: string;

  /** 검색 타입 */
  searchType: SearchType;

  /** 결과 개수 (기본값: 12) */
  topK?: number;

  /** 페이지 번호 (기본값: 1) */
  page?: number;
}

/**
 * 검색 결과
 */
export interface SearchResult {
  /** 이미지 에셋 목록 */
  images: ImageAsset[];

  /** 총 결과 개수 */
  total: number;

  /** 현재 페이지 */
  page: number;

  /** 페이지당 결과 개수 */
  perPage: number;

  /** 검색 메타데이터 */
  metadata?: {
    ssotaCount?: number;
    unsplashCount?: number;
    searchTime?: number;
  };
}
