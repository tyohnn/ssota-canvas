/**
 * Image Search Server Actions
 *
 * SSOTA Image Vault + Unsplash 통합 검색 액션
 *
 * ⚠️ Migrated from block-management domain to image-app-space domain
 */

'use server';

import { ImageSearchService } from '../backend/services/image-search.service';
import { ActionResult, ok, err } from '@/lib/action-result';
import { config } from '@/config';
import {
  SearchImageAssetsRequestSchema,
  type SearchImageAssetsRequest,
} from '../shared/dtos/requests/image-search.requests';
import type {
  SearchResult,
  UnsplashImage,
  UnsplashSearchResponse,
} from '../shared/types/image-search.types';
import {
  getAuthenticatedUser,
  verifyAccess,
  type AuthenticatedUser,
} from '@/domains/common/auth/helpers';
import { getAuthErrorMessage } from '@/domains/common/auth/error';

/**
 * 이미지 검색 Server Action
 *
 * SSOTA Image Vault + Unsplash 통합 검색
 */
export async function searchImageAssetsAction(
  request: unknown
): Promise<ActionResult<SearchResult>> {
  // 1. Runtime Validation
  const parseResult = SearchImageAssetsRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to searchImageAssetsAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      issues: parseResult.error.issues,
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    return await searchImageAssetsInternal(validatedRequest, user);
  } catch (error) {
    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'UNAUTHORIZED' }
    );
  }
}

async function searchImageAssetsInternal(
  request: SearchImageAssetsRequest,
  user: AuthenticatedUser
): Promise<ActionResult<SearchResult>> {
  try {
    const imageSearchService = new ImageSearchService();

    const result = await imageSearchService.searchImages({
      query: request.query,
      searchType: request.searchType,
      topK: request.topK,
      page: request.page,
    });

    return ok(result);
  } catch (error) {
    return err(
      error instanceof Error ? error.message : 'Failed to search images',
      { code: 'SEARCH_FAILED' }
    );
  }
}

/**
 * Unsplash 이미지 검색 Server Action
 */
export async function searchUnsplashImagesAction(
  query?: string,
  category?: string
): Promise<ActionResult<UnsplashImage[]>> {
  try {
    const accessKey = config.providers.unsplash;
    if (!accessKey) {
      return err('Unsplash API key is not configured', {
        code: 'UNSPLASH_KEY_MISSING',
      });
    }

    const searchTerm = [query, category].filter(Boolean).join(' ');

    const params = new URLSearchParams({
      client_id: accessKey,
      per_page: '20',
      ...(searchTerm && { query: searchTerm }),
    });

    const endpoint = searchTerm
      ? `https://api.unsplash.com/search/photos?${params}`
      : `https://api.unsplash.com/photos/random?${params}&count=20`;

    const response = await fetch(endpoint, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    const results: UnsplashImage[] = searchTerm
      ? (data as UnsplashSearchResponse).results
      : data;

    const uniqueResults = Array.from(
      new Map(results.map(img => [img.id, img])).values()
    );

    return ok(uniqueResults);
  } catch (error) {
    return err(
      error instanceof Error
        ? error.message
        : 'Failed to search Unsplash images',
      { code: 'UNSPLASH_SEARCH_FAILED' }
    );
  }
}

/**
 * Unsplash 다운로드 트래킹 Server Action
 */
export async function trackUnsplashDownloadAction(
  imageId: string
): Promise<ActionResult<void>> {
  try {
    const accessKey = config.providers.unsplash;
    if (!accessKey) {
      return ok(undefined);
    }

    await fetch(
      `https://api.unsplash.com/photos/${imageId}/download?client_id=${accessKey}`
    );

    return ok(undefined);
  } catch (error) {
    // Silent fail
    return ok(undefined);
  }
}
