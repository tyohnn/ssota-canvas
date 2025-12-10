/**
 * Image Migration Server Actions
 *
 * canvas-assets에서 image-assets로 이미지 마이그레이션
 *
 * 마이그레이션 전략:
 * 1. canvas-assets에서 파일 다운로드
 * 2. image-assets에 업로드 (새 경로)
 * 3. image_assets 테이블 업데이트 (image_url을 새 storage path로)
 * 4. blocks.properties 업데이트 (imageAssetId 추가)
 */

'use server';

import { z } from 'zod';
import { ActionResult, err, ok } from '@/lib/action-result';
import { getAuthenticatedUser } from '@/domains/common/auth/helpers';
import { supabaseAdmin } from '@/utils/supabase/server';
import { adminDb } from '@/db';
import { blocks } from '@/db/schema';
import { imageAssets } from '@/db/schemas/image-app-space-schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { AdminStorageService } from '@/domains/storage/backend/services/admin-storage.service';

// ============================================================================
// Types & Schemas
// ============================================================================

const MigrateSingleImageRequestSchema = z.object({
  blockId: z.uuid(),
});

const MigrateBatchRequestSchema = z.object({
  workspaceId: z.uuid().optional(),
  limit: z.number().min(1).max(100).default(50),
});

export interface MigrationResult {
  migratedCount: number;
  failedCount: number;
  errors: Array<{ blockId: string; error: string }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Signed URL에서 Storage Path 추출
 */
function extractStoragePathFromUrl(url: string): string | null {
  try {
    // Pattern: /storage/v1/object/sign/canvas-assets/{path}?token=...
    const match = url.match(
      /\/storage\/v1\/object\/(sign|public)\/canvas-assets\/([^?]+)/
    );
    if (match && match[2]) {
      // URL 디코딩
      return decodeURIComponent(match[2]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 새로운 Storage Path 생성 (image-assets용)
 */
function generateNewStoragePath(
  workspaceId: string,
  originalPath: string
): string {
  // 원본 파일명 추출
  const fileName = originalPath.split('/').pop() || `${Date.now()}.jpg`;

  // 새 경로: {workspaceId}/{date}/{uuid}-{filename}
  const date =
    new Date().toISOString().split('T')[0]?.replace(/-/g, '') ||
    new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

  return `${workspaceId}/${date}/${uuid}-${fileName}`;
}

/**
 * 파일을 canvas-assets에서 image-assets로 복사
 */
async function copyFileToImageAssets(
  sourcePath: string,
  destPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. canvas-assets에서 다운로드
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('canvas-assets')
      .download(sourcePath);

    if (downloadError || !fileData) {
      return {
        success: false,
        error: `Download failed: ${downloadError?.message || 'No data'}`,
      };
    }

    // 2. image-assets에 업로드
    const { error: uploadError } = await supabaseAdmin.storage
      .from('image-assets')
      .upload(destPath, fileData, {
        contentType: fileData.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Signed URL 만료 시간 계산 (24시간)
 */
function getSignedUrlExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  return expiresAt;
}

// ============================================================================
// Migration Actions
// ============================================================================

/**
 * 단일 블록의 이미지 마이그레이션
 *
 * 1. 블록에서 canvas-assets URL 확인
 * 2. 파일을 image-assets로 복사
 * 3. image_assets 테이블에 레코드 생성
 * 4. 블록의 imageAssetId 업데이트
 */
export async function migrateSingleImageAction(
  request: unknown
): Promise<ActionResult<{ imageAssetId: string; newUrl: string }>> {
  // 1. Trust Boundary 검증
  const parseResult = MigrateSingleImageRequestSchema.safeParse(request);
  if (!parseResult.success) {
    return err('Invalid request', { code: 'INVALID_REQUEST' });
  }

  const { blockId } = parseResult.data;

  try {
    const user = await getAuthenticatedUser();

    // 2. 블록 조회
    const [block] = await adminDb
      .select()
      .from(blocks)
      .where(eq(blocks.id, blockId))
      .limit(1);

    if (!block) {
      return err('Block not found', { code: 'NOT_FOUND' });
    }

    if (block.block_type !== 'image') {
      return err('Not an image block', { code: 'INVALID_BLOCK_TYPE' });
    }

    const properties = block.properties as Record<string, unknown>;

    // 3. 이미 마이그레이션됐는지 확인
    if (properties.imageAssetId) {
      // 이미 imageAssetId가 있으면 해당 asset 조회
      const [existingAsset] = await adminDb
        .select()
        .from(imageAssets)
        .where(eq(imageAssets.id, properties.imageAssetId as string))
        .limit(1);

      if (existingAsset) {
        // Signed URL 생성 (AdminStorageService 사용)
        const storageService = new AdminStorageService();
        try {
          const signedUrl = await storageService.createImageSignedUrl(
            existingAsset.image_url,
            block.workspace_id,
            user.id,
            existingAsset.is_public
          );

          return ok({
            imageAssetId: existingAsset.id,
            newUrl: signedUrl,
          });
        } catch (error) {
          // Signed URL 생성 실패 시 기존 URL 반환
          console.warn(
            '[migrateSingleImageAction] Failed to create signed URL for existing asset:',
            error
          );
          return ok({
            imageAssetId: existingAsset.id,
            newUrl: existingAsset.image_url,
          });
        }
      }
    }

    // 4. canvas-assets URL인지 확인
    const imageUrl = properties.imageUrl as string;
    if (
      !imageUrl ||
      !imageUrl.includes('canvas-assets') ||
      !imageUrl.includes('/storage/v1/object/')
    ) {
      return err('Not a canvas-assets image', { code: 'INVALID_SOURCE' });
    }

    // 5. Storage path 추출
    const sourcePath = extractStoragePathFromUrl(imageUrl);
    if (!sourcePath) {
      return err('Failed to extract storage path', { code: 'PARSE_ERROR' });
    }

    // 6. 새 경로 생성
    const newPath = generateNewStoragePath(block.workspace_id, sourcePath);

    // 7. 파일 복사
    const copyResult = await copyFileToImageAssets(sourcePath, newPath);
    if (!copyResult.success) {
      return err(copyResult.error || 'Copy failed', { code: 'COPY_FAILED' });
    }

    // 8. Signed URL 생성 (AdminStorageService 사용)
    const storageService = new AdminStorageService();
    let signedUrl: string;
    try {
      signedUrl = await storageService.createImageSignedUrl(
        newPath,
        block.workspace_id,
        user.id,
        false // isPublic
      );
    } catch (error) {
      return err(
        error instanceof Error
          ? `Failed to create signed URL: ${error.message}`
          : 'Failed to create signed URL',
        { code: 'SIGNED_URL_FAILED' }
      );
    }

    // 9. image_assets 테이블에 레코드 생성
    const imageSource = properties.imageSource as string;
    const newAssetResult = await adminDb
      .insert(imageAssets)
      .values({
        asset_type: imageSource === 'unsplash' ? 'unsplash' : 'user-upload',
        image_url: newPath, // 새 storage path
        signed_url: signedUrl,
        signed_url_expires_at: getSignedUrlExpiresAt(),
        metadata: {
          migratedFrom: 'canvas-assets',
          migratedAt: new Date().toISOString(),
          originalPath: sourcePath,
          ...(properties.unsplashAuthorName &&
          typeof properties.unsplashAuthorName === 'string'
            ? {
                authorName: properties.unsplashAuthorName,
                ...(typeof properties.unsplashAuthorLink === 'string' && {
                  authorLink: properties.unsplashAuthorLink,
                }),
              }
            : {}),
        },
        title:
          (properties.caption as string) ||
          (properties.alt as string) ||
          'Migrated Image',
        description: (properties.caption as string) || null,
        created_by: block.created_by || user.id,
        workspace_id: block.workspace_id,
        is_public: false,
        is_deleted: false,
        view_count: 0, // 명시적 설정
        bookmark_count: 0, // 명시적 설정
        like_count: 0, // 명시적 설정
        use_count: 1,
      })
      .returning();

    const newAsset = newAssetResult[0];
    if (!newAsset) {
      return err('Failed to create image asset', { code: 'INSERT_FAILED' });
    }

    // 10. 블록의 properties 업데이트
    await adminDb
      .update(blocks)
      .set({
        properties: {
          ...properties,
          imageAssetId: newAsset.id,
          imageUrl: signedUrl, // 캐시용
        },
        updated_at: new Date(),
      })
      .where(eq(blocks.id, blockId));

    return ok({
      imageAssetId: newAsset.id,
      newUrl: signedUrl,
    });
  } catch (error) {
    console.error('[migrateSingleImageAction] Error:', error);
    return err(error instanceof Error ? error.message : 'Migration failed', {
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * 배치 마이그레이션 (여러 블록을 한번에)
 *
 * 관리자용 또는 백그라운드 작업용
 */
export async function migrateBatchImagesAction(
  request: unknown
): Promise<ActionResult<MigrationResult>> {
  // 1. Trust Boundary 검증
  const parseResult = MigrateBatchRequestSchema.safeParse(request);
  if (!parseResult.success) {
    return err('Invalid request', { code: 'INVALID_REQUEST' });
  }

  const { workspaceId, limit } = parseResult.data;

  try {
    await getAuthenticatedUser();

    // 2. 마이그레이션 대상 블록들 조회
    const conditions = [
      eq(blocks.block_type, 'image'),
      isNull(blocks.deleted_at),
      sql`${blocks.properties}->>'imageUrl' LIKE '%canvas-assets%'`,
      sql`${blocks.properties}->>'imageUrl' LIKE '%/storage/v1/object/%'`,
      sql`(${blocks.properties}->>'imageAssetId' IS NULL OR ${blocks.properties}->>'imageAssetId' = '')`,
    ];

    if (workspaceId) {
      conditions.push(eq(blocks.workspace_id, workspaceId));
    }

    const blocksToMigrate = await adminDb
      .select()
      .from(blocks)
      .where(and(...conditions))
      .limit(limit);

    const result: MigrationResult = {
      migratedCount: 0,
      failedCount: 0,
      errors: [],
    };

    // 3. 각 블록 마이그레이션
    for (const block of blocksToMigrate) {
      const migrationResult = await migrateSingleImageAction({
        blockId: block.id,
      });

      if (migrationResult.success) {
        result.migratedCount++;
      } else {
        result.failedCount++;
        result.errors.push({
          blockId: block.id,
          error: migrationResult.error || 'Unknown error',
        });
      }
    }

    return ok(result);
  } catch (error) {
    console.error('[migrateBatchImagesAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Batch migration failed',
      { code: 'INTERNAL_ERROR' }
    );
  }
}

/**
 * 마이그레이션 상태 확인
 *
 * 몇 개의 이미지가 아직 마이그레이션되지 않았는지 확인
 */
export async function getMigrationStatusAction(request: unknown): Promise<
  ActionResult<{
    totalLegacyImages: number;
    migratedImages: number;
    pendingImages: number;
  }>
> {
  const requestSchema = z.object({
    workspaceId: z.string().uuid().optional(),
  });

  const parseResult = requestSchema.safeParse(request);
  if (!parseResult.success) {
    return err('Invalid request', { code: 'INVALID_REQUEST' });
  }

  const { workspaceId } = parseResult.data;

  try {
    await getAuthenticatedUser();

    // canvas-assets URL을 가진 이미지 블록 수
    const legacyConditions = [
      eq(blocks.block_type, 'image'),
      isNull(blocks.deleted_at),
      sql`${blocks.properties}->>'imageUrl' LIKE '%canvas-assets%'`,
    ];

    if (workspaceId) {
      legacyConditions.push(eq(blocks.workspace_id, workspaceId));
    }

    const legacyCountResult = await adminDb
      .select({ count: sql<number>`count(*)` })
      .from(blocks)
      .where(and(...legacyConditions));

    const legacyCount = legacyCountResult[0];
    if (!legacyCount) {
      return err('Failed to get legacy count', { code: 'QUERY_FAILED' });
    }

    // 마이그레이션된 블록 수 (imageAssetId가 있는 것)
    const migratedConditions = [
      ...legacyConditions,
      sql`${blocks.properties}->>'imageAssetId' IS NOT NULL`,
      sql`${blocks.properties}->>'imageAssetId' != ''`,
    ];

    const migratedCountResult = await adminDb
      .select({ count: sql<number>`count(*)` })
      .from(blocks)
      .where(and(...migratedConditions));

    const migratedCount = migratedCountResult[0];
    if (!migratedCount) {
      return err('Failed to get migrated count', { code: 'QUERY_FAILED' });
    }

    const total = Number(legacyCount.count);
    const migrated = Number(migratedCount.count);

    return ok({
      totalLegacyImages: total,
      migratedImages: migrated,
      pendingImages: total - migrated,
    });
  } catch (error) {
    console.error('[getMigrationStatusAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to get status',
      { code: 'INTERNAL_ERROR' }
    );
  }
}
