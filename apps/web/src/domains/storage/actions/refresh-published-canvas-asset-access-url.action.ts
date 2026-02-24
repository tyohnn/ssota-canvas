/**
 * 공개(Published) 페이지 Canvas Asset Access URL 갱신 Action
 *
 * ⚠️ Security: 인증 불필요 — publishToken만 검증
 * - Trust boundary: unknown input + Zod 검증
 * - 일회성 Signed URL만 반환, DB 갱신 없음
 */

'use server';

import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { DrizzlePublishedPageRepository } from '@/domains/share/backend/repositories/implementations/drizzle-published-page.repository';
import { PublishToken } from '@/domains/share/shared/value-objects/publish-token.vo';

import { AdminStorageService } from '../backend/services/admin-storage.service';
import type { RefreshPublishedCanvasAssetAccessUrlResult } from '../shared/dtos/responses';
import {
  type RefreshPublishedCanvasAssetAccessUrlRequest,
  RefreshPublishedCanvasAssetAccessUrlRequestSchema,
} from '../shared/dtos/requests';

/** 1일. Signed URL 유효기간 */
const ONE_DAY_SECONDS = 86400;

/**
 * 공개 페이지 방문자용 Access URL 갱신 (Server Action)
 *
 * Trust boundary: 런타임 검증 후 internal 호출
 */
export async function refreshPublishedCanvasAssetAccessUrlAction(
  input: unknown
): Promise<RefreshPublishedCanvasAssetAccessUrlResult> {
  const parseResult =
    RefreshPublishedCanvasAssetAccessUrlRequestSchema.safeParse(input);

  if (!parseResult.success) {
    console.warn(
      '[Security] Invalid request to refreshPublishedCanvasAssetAccessUrlAction',
      {
        errors: parseResult.error.issues,
        timestamp: new Date().toISOString(),
      }
    );
    return { success: false, error: 'Invalid request' };
  }

  return refreshPublishedCanvasAssetAccessUrlInternal(parseResult.data);
}

/**
 * 내부 구현 (검증된 요청만 처리)
 *
 * @param safeDto - 검증된 publishToken, blockId
 */
async function refreshPublishedCanvasAssetAccessUrlInternal(
  safeDto: RefreshPublishedCanvasAssetAccessUrlRequest
): Promise<RefreshPublishedCanvasAssetAccessUrlResult> {
  try {
    const { publishToken: tokenStr, blockId } = safeDto;

    const publishedPageRepository = new DrizzlePublishedPageRepository();
    const publishedPage = await publishedPageRepository.findByToken(
      new PublishToken(tokenStr)
    );
    if (!publishedPage || publishedPage.status !== 'published') {
      return { success: false, error: 'Link not found' };
    }

    const pageId = new PageId(publishedPage.pageId);
    const blockMountRepository = new DrizzleBlockMountRepository();
    const pathUrl =
      await blockMountRepository.findPathUrlByPageIdAndBlockSlug(
        pageId,
        blockId
      );

    if (!pathUrl) {
      return { success: false, error: 'No pathUrl (external URL or missing)' };
    }

    const adminStorage = new AdminStorageService();
    const url = await adminStorage.createCanvasAssetSignedUrl(
      pathUrl,
      ONE_DAY_SECONDS
    );

    return { success: true, url };
  } catch (error) {
    console.error(
      '[refreshPublishedCanvasAssetAccessUrlInternal] Error:',
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
