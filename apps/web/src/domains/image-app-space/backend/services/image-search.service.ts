/**
 * Image Search Service
 *
 * SSOTA Image Vault + Unsplash 통합 검색 서비스
 *
 * 특징:
 * - SSOTA: 시맨틱 검색 (임베딩 기반)
 * - Unsplash: 키워드 검색
 * - 결과 병합 및 스코어링
 *
 * ⚠️ Migrated from block-management domain to image-app-space domain
 */

import type {
  ImageAsset,
  SearchParams,
  SearchResult,
  ImageSource,
  SearchType,
  UnsplashImage,
  UnsplashSearchResponse,
} from '../../shared/types/image-search.types';
import { config } from '@/config';

/**
 * Image Search Service
 */
export class ImageSearchService {
  private readonly unsplashAccessKey: string;

  constructor() {
    this.unsplashAccessKey = config.providers.unsplash;

    if (!this.unsplashAccessKey) {
      console.warn('[ImageSearchService] UNSPLASH_ACCESS_KEY is not set');
    }
  }

  /**
   * 통합 이미지 검색
   *
   * @param params - 검색 파라미터
   * @returns 검색 결과
   */
  async searchImages(params: SearchParams): Promise<SearchResult> {
    const startTime = Date.now();
    const { query, searchType, topK = 12, page = 1 } = params;

    try {
      // 검색 타입에 따라 병렬 검색 실행
      const [ssotaResults, unsplashResults] = await Promise.allSettled([
        this.shouldSearchSsota(searchType)
          ? this.searchSsotaImagesSemantic(query, topK)
          : Promise.resolve([]),
        this.shouldSearchUnsplash(searchType)
          ? this.searchUnsplashByKeyword(query, page, topK)
          : Promise.resolve([]),
      ]);

      // 결과 추출
      const ssotaImages =
        ssotaResults.status === 'fulfilled' ? ssotaResults.value : [];
      const unsplashImages =
        unsplashResults.status === 'fulfilled' ? unsplashResults.value : [];

      // 에러 로깅
      if (ssotaResults.status === 'rejected') {
        console.error(
          '[ImageSearchService] SSOTA search failed:',
          ssotaResults.reason
        );
      }
      if (unsplashResults.status === 'rejected') {
        console.error(
          '[ImageSearchService] Unsplash search failed:',
          unsplashResults.reason
        );
      }

      // 결과 병합 및 스코어링
      const mergedImages = this.mergeResults(
        ssotaImages,
        unsplashImages,
        params
      );

      // 페이지네이션 처리
      const startIdx = (page - 1) * topK;
      const endIdx = startIdx + topK;
      const paginatedImages = mergedImages.slice(startIdx, endIdx);

      const searchTime = Date.now() - startTime;

      return {
        images: paginatedImages,
        total: mergedImages.length,
        page,
        perPage: topK,
        metadata: {
          ssotaCount: ssotaImages.length,
          unsplashCount: unsplashImages.length,
          searchTime,
        },
      };
    } catch (error) {
      console.error('[ImageSearchService] Search failed:', error);
      throw new Error(
        `Image search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * SSOTA 이미지 시맨틱 검색
   *
   * TODO: Vector DB 연동 필요
   * 현재는 Mock 데이터 반환
   *
   * @param query - 검색 쿼리
   * @param topK - 결과 개수
   * @returns SSOTA 이미지 에셋 목록
   */
  private async searchSsotaImagesSemantic(
    query: string,
    topK: number
  ): Promise<ImageAsset[]> {
    // TODO: Vector DB 연동
    // 1. 쿼리를 임베딩으로 변환
    // 2. Vector DB에서 유사도 검색
    // 3. topK 개의 이미지 반환

    console.log('[ImageSearchService] SSOTA semantic search:', { query, topK });

    // Mock 데이터 (임시)
    return [];
  }

  /**
   * Unsplash 키워드 검색
   *
   * @param query - 검색 쿼리
   * @param page - 페이지 번호
   * @param perPage - 페이지당 결과 개수
   * @returns Unsplash 이미지 에셋 목록
   */
  private async searchUnsplashByKeyword(
    query: string,
    page: number,
    perPage: number
  ): Promise<ImageAsset[]> {
    if (!this.unsplashAccessKey) {
      console.warn('[ImageSearchService] Unsplash API key is not set');
      return [];
    }

    try {
      const params = new URLSearchParams({
        client_id: this.unsplashAccessKey,
        query,
        page: page.toString(),
        per_page: Math.min(perPage, 30).toString(), // Unsplash 최대 30
      });

      const response = await fetch(
        `https://api.unsplash.com/search/photos?${params}`
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = (await response.json()) as UnsplashSearchResponse;

      return data.results.map(image => ({
        id: `unsplash:${image.id}`,
        url: image.urls.regular,
        thumbnailUrl: image.urls.small,
        alt: image.alt_description || undefined,
        source: 'unsplash' as ImageSource,
        metadata: {
          authorName: image.user.name,
          authorLink: `${image.user.links.html}?utm_source=ssota&utm_medium=referral`,
          unsplashId: image.id,
        },
      }));
    } catch (error) {
      console.error('[ImageSearchService] Unsplash search failed:', error);
      throw error;
    }
  }

  /**
   * 검색 결과 병합 및 스코어링
   *
   * @param ssotaImages - SSOTA 이미지 목록
   * @param unsplashImages - Unsplash 이미지 목록
   * @param params - 검색 파라미터
   * @returns 병합된 이미지 목록 (스코어 순 정렬)
   */
  private mergeResults(
    ssotaImages: ImageAsset[],
    unsplashImages: ImageAsset[],
    params: SearchParams
  ): ImageAsset[] {
    // 검색 타입에 따라 가중치 조정
    const weights = this.getWeights(params.searchType);

    // SSOTA 이미지 스코어링
    const scoredSsotaImages = ssotaImages.map((image, index) => ({
      ...image,
      score:
        this.calculateSsotaScore(image, index, ssotaImages.length) *
        weights.ssota,
    }));

    // Unsplash 이미지 스코어링
    const scoredUnsplashImages = unsplashImages.map((image, index) => ({
      ...image,
      score:
        this.calculateUnsplashScore(image, index, unsplashImages.length) *
        weights.unsplash,
    }));

    // 병합 및 정렬
    const mergedImages = [...scoredSsotaImages, ...scoredUnsplashImages].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );

    return mergedImages;
  }

  /**
   * 검색 타입에 따른 가중치 계산
   */
  private getWeights(searchType: SearchParams['searchType']): {
    ssota: number;
    unsplash: number;
  } {
    switch (searchType) {
      case 'semantic':
        return { ssota: 1.0, unsplash: 0.0 };
      case 'keyword':
        return { ssota: 0.0, unsplash: 1.0 };
      case 'combined':
      default:
        return { ssota: 0.6, unsplash: 0.4 }; // SSOTA 우선
    }
  }

  /**
   * SSOTA 이미지 스코어 계산
   *
   * 시맨틱 유사도 기반 (Vector DB에서 제공하는 스코어 사용)
   */
  private calculateSsotaScore(
    image: ImageAsset,
    index: number,
    total: number
  ): number {
    // Vector DB에서 제공하는 스코어가 있으면 사용
    if (image.score !== undefined) {
      return image.score;
    }

    // 없으면 순위 기반 스코어 (1.0 ~ 0.0)
    return 1.0 - index / Math.max(total, 1);
  }

  /**
   * Unsplash 이미지 스코어 계산
   *
   * 순위 기반 (Unsplash API 자체 순위 사용)
   */
  private calculateUnsplashScore(
    image: ImageAsset,
    index: number,
    total: number
  ): number {
    // 순위 기반 스코어 (1.0 ~ 0.0)
    return 1.0 - index / Math.max(total, 1);
  }

  /**
   * SSOTA 검색 여부 판단
   */
  private shouldSearchSsota(searchType: SearchType): boolean {
    return searchType === 'semantic' || searchType === 'combined';
  }

  /**
   * Unsplash 검색 여부 판단
   */
  private shouldSearchUnsplash(searchType: SearchType): boolean {
    return searchType === 'keyword' || searchType === 'combined';
  }
}
