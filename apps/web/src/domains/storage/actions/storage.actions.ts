/**
 * Storage Server Actions
 *
 * 파일 스토리지 관련 Server Actions
 */

'use server';

import { createClient } from '@/utils/supabase/server';
import { adminDb } from '@/db';
import { blocks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { StorageBucket } from '../types/storage.types';
import { StorageService } from '../backend/services/storage.service';
import type { ImageBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { DrizzleSourceRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source.repository';
import { SourceId } from '@/domains/source-management/shared/value-objects/source-id.vo';
import { SourceUrl } from '@/domains/source-management/shared/value-objects/source-url.vo';

/** 1일. 보안·워크스페이스 권한 회수 시 유출 URL 노출 기간 최소화 */
const ONE_DAY_SECONDS = 86400;

/**
 * Signed URL이 만료된 경우 새로운 URL을 생성하여 반환
 */
export async function refreshImageUrlAction(
  blockId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Service 인스턴스 생성
    const storageService = new StorageService(supabase);

    // 3. 블록 데이터 조회
    const [block] = await adminDb
      .select()
      .from(blocks)
      .where(eq(blocks.id, blockId))
      .limit(1);

    if (!block) {
      return { success: false, error: 'Block not found' };
    }

    // 4. properties에서 imageUrl 추출
    const properties = block.properties as ImageBlockProperties;
    const currentUrl = properties.imageUrl;

    if (!currentUrl) {
      return { success: false, error: 'No image URL found in block' };
    }

    // 5. URL에서 path 추출 (Service 사용)
    const path = storageService.extractPathFromUrl(currentUrl);

    if (!path) {
      return { success: false, error: 'Failed to extract path from URL' };
    }

    // 6. 새로운 signed URL 생성 (Service 사용)
    const result = await storageService.refreshSignedUrl(
      path,
      StorageBucket.CANVAS_ASSETS
    );

    if (!result.success || !result.url) {
      return { success: false, error: result.error };
    }

    const newUrl = result.url;

    // 7. 블록 업데이트 (새로운 URL 저장)
    await adminDb
      .update(blocks)
      .set({
        properties: {
          ...properties,
          imageUrl: newUrl,
        },
        updated_at: new Date(),
      })
      .where(eq(blocks.id, blockId));

    return { success: true, url: newUrl };
  } catch (error) {
    console.error('Error refreshing image URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export type CanvasAssetBlockType = 'pdf' | 'audio';

/**
 * pathUrl로 새 Signed URL 생성 후 블록의 accessUrl·accessUrlExpiresAt 갱신.
 * 연결된 source가 있으면 source.url도 새 accessUrl로 갱신.
 *
 * @param workspaceId - 워크스페이스 ID
 * @param blockId - 블록 slug (8~10 hex)
 */
export async function refreshCanvasAssetAccessUrlAction(
  workspaceId: string,
  blockId: string,
  _blockType: CanvasAssetBlockType
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const blockRepository = new DrizzleBlockRepository();
    const block = await blockRepository.findByWorkspaceIdAndSlug(
      new WorkspaceId(workspaceId),
      blockId
    );

    if (!block) {
      return { success: false, error: 'Block not found' };
    }

    const blockIdUuid = block.id.value;
    const properties = (block.properties ?? {}) as unknown as Record<
      string,
      unknown
    >;
    const pathUrl = properties.pathUrl as string | undefined;
    const sourceId = block.sourceId;

    if (!pathUrl || typeof pathUrl !== 'string' || pathUrl.trim() === '') {
      return { success: false, error: 'No pathUrl (external URL or missing)' };
    }

    const storageService = new StorageService(supabase);
    const result = await storageService.refreshSignedUrl(
      pathUrl,
      StorageBucket.CANVAS_ASSETS,
      ONE_DAY_SECONDS
    );

    if (!result.success || !result.url) {
      return { success: false, error: result.error };
    }

    const newAccessUrl = result.url;
    const accessUrlExpiresAt = new Date(
      Date.now() + ONE_DAY_SECONDS * 1000
    ).toISOString();

    await adminDb
      .update(blocks)
      .set({
        properties: {
          ...properties,
          accessUrl: newAccessUrl,
          accessUrlExpiresAt,
        },
        updated_at: new Date(),
      })
      .where(eq(blocks.id, blockIdUuid));

    if (sourceId) {
      const sourceRepository = new DrizzleSourceRepository();
      const source = await sourceRepository.findById(new SourceId(sourceId));
      if (source) {
        source.updateUrl(new SourceUrl(newAccessUrl));
        await sourceRepository.update(source);
      }
    }

    return { success: true, url: newAccessUrl };
  } catch (error) {
    console.error('Error refreshing canvas asset access URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
