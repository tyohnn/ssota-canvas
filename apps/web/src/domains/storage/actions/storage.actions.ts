/**
 * Storage Server Actions
 *
 * 파일 스토리지 관련 Server Actions
 */

'use server';

import { createClient } from '@/utils/supabase/server';
import { adminDb } from '@/db';
import { blocks } from '@/db/schema-dev';
import { eq } from 'drizzle-orm';
import { StorageBucket } from '../types/storage.types';
import { StorageService } from '../backend/services/storage.service';
import type { ImageBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

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
