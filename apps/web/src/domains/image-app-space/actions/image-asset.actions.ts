/**
 * Image Asset Server Actions
 *
 * Technical Specification 참조: 04-technical-specification.md
 * Trust Boundary 패턴 적용
 */

'use server';

import type { ImageAsset } from '@/db/schemas/image-app-space-schema';
import { getAuthErrorMessage } from '@/domains/common/auth/error';
import { getAuthenticatedUser } from '@/domains/common/auth/helpers';
import { AdminStorageService } from '@/domains/storage/backend/services/admin-storage.service';
import { isWorkspaceMember } from '@/domains/workspace-management/backend/services/workspace-membership.service';
import { ActionResult, err, ok } from '@/lib';
import { createClient } from '@/utils/supabase/server';

import { DrizzleImageAssetRepository } from '../backend/repositories/implementations/drizzle-image-asset.repository';
import type { ImageAssetWithStats } from '../backend/repositories/interfaces/image-asset.repository.interface';
import { ImageAssetService } from '../backend/services/image-asset.service';
import {
  type BrowseCommunityFeedRequest,
  BrowseCommunityFeedRequestSchema,
  type BrowseFollowingFeedRequest,
  BrowseFollowingFeedRequestSchema,
  type ChangeImageVisibilityRequest,
  ChangeImageVisibilityRequestSchema,
  type CreateImageAssetRequest,
  CreateImageAssetRequestSchema,
  type GetImageUrlRequest,
  GetImageUrlRequestSchema,
  type GetWorkspaceImagesRequest,
  GetWorkspaceImagesRequestSchema,
  type UpdateImageMetadataRequest,
  UpdateImageMetadataRequestSchema,
} from '../shared/schemas/image-asset.schemas';

/**
 * Helper: 메타데이터 추출
 */
function extractImageMetadata(imageAsset: ImageAsset): {
  unsplashAuthorName?: string;
  unsplashAuthorLink?: string;
  title?: string;
  description?: string;
} {
  const metadata: {
    unsplashAuthorName?: string;
    unsplashAuthorLink?: string;
    title?: string;
    description?: string;
  } = {};

  // Unsplash 메타데이터
  if (imageAsset.asset_type === 'unsplash' && imageAsset.metadata) {
    const meta = imageAsset.metadata as Record<string, any>;
    metadata.unsplashAuthorName = meta.authorName;
    metadata.unsplashAuthorLink = meta.authorLink;
  }

  // 공통 메타데이터
  if (imageAsset.title) {
    metadata.title = imageAsset.title;
  }
  if (imageAsset.description) {
    metadata.description = imageAsset.description;
  }

  return metadata;
}

/**
 * Helper: Signed URL 만료 확인 (서버 사이드용)
 *
 * @param expiresAt - signed_url_expires_at 필드 값
 * @param bufferMinutes - 만료 전 갱신 버퍼 (기본 60분)
 */
function isSignedUrlExpiredByDate(
  expiresAt: Date | null | undefined,
  bufferMinutes = 60
): boolean {
  if (!expiresAt) {
    return true;
  }

  const now = new Date();
  const bufferMs = bufferMinutes * 60 * 1000;
  const expiryWithBuffer = new Date(expiresAt.getTime() - bufferMs);

  return now >= expiryWithBuffer;
}

/**
 * Helper: Signed URL에서 만료 시간 추출 (24시간 기본)
 */
function getSignedUrlExpiresAt(): Date {
  // Signed URL은 24시간 유효
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  return expiresAt;
}

/**
 * 이미지 자산 생성 Server Action
 *
 * Process Model: Scenario 1 - AI 이미지 생성 후 저장
 *
 * ⚠️ Security: Trust Boundary - unknown + Zod 검증
 */
export async function createImageAssetAction(
  request: unknown
): Promise<ActionResult<ImageAsset>> {
  // 1. Trust Boundary 검증
  const parseResult = CreateImageAssetRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to createImageAssetAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 확인
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('Unauthorized', { code: 'UNAUTHORIZED' });
    }

    // 3. Internal 함수 호출
    return await createImageAssetInternal(validatedRequest, user.id);
  } catch (error) {
    console.error('[createImageAssetAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Internal server error',
      { code: 'INTERNAL_ERROR' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function createImageAssetInternal(
  request: CreateImageAssetRequest,
  userId: string
): Promise<ActionResult<ImageAsset>> {
  try {
    // 의존성 주입
    const repository = new DrizzleImageAssetRepository();
    const service = new ImageAssetService(repository);

    // Command 생성
    const command = {
      assetType: request.assetType as
        | 'ai-generated'
        | 'unsplash'
        | 'user-upload',
      imageUrl: request.imageUrl,
      thumbnailUrl: request.thumbnailUrl,
      width: request.width,
      height: request.height,
      fileSize: request.fileSize,
      mimeType: request.mimeType,
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      metadata: request.metadata,
      title: request.title,
      description: request.description,
      tags: request.tags,
      category: request.category,
      createdBy: userId,
      workspaceId: request.workspaceId,
    };

    // Service 호출
    const result = await service.createImageAsset(command);

    if (result.isError()) {
      return err(result.error.message, {
        code: result.error.code,
      });
    }

    return ok(result.value);
  } catch (error) {
    return err(
      error instanceof Error ? error.message : 'Failed to create image asset',
      { code: 'CREATE_FAILED' }
    );
  }
}

/**
 * 커뮤니티 피드 조회 Server Action
 *
 * Process Model: Scenario 3 - Community Feed
 */
export async function browseCommunityFeedAction(
  request: unknown
): Promise<ActionResult<ImageAssetWithStats[]>> {
  // 1. Trust Boundary 검증
  const parseResult = BrowseCommunityFeedRequestSchema.safeParse(request);

  if (!parseResult.success) {
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 확인 (필수)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('Unauthorized', { code: 'UNAUTHORIZED' });
    }

    // 3. Repository 직접 호출 (조회만 하므로 Service 불필요)
    const repository = new DrizzleImageAssetRepository();

    const images = await repository.findPublicImages({
      sort: validatedRequest.sort,
      category: validatedRequest.category,
      page: validatedRequest.page,
      perPage: validatedRequest.perPage,
      currentUserId: user.id,
    });

    return ok(images);
  } catch (error) {
    console.error('[browseCommunityFeedAction] Error:', error);
    return err(
      error instanceof Error
        ? error.message
        : 'Failed to browse community feed',
      { code: 'FETCH_FAILED' }
    );
  }
}

/**
 * 팔로잉 피드 조회 Server Action
 *
 * Process Model: Scenario 5 - Following Feed
 */
export async function browseFollowingFeedAction(
  request: unknown
): Promise<ActionResult<ImageAssetWithStats[]>> {
  // 1. Trust Boundary 검증
  const parseResult = BrowseFollowingFeedRequestSchema.safeParse(request);

  if (!parseResult.success) {
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 확인 (필수)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('Unauthorized', { code: 'UNAUTHORIZED' });
    }

    // 3. Repository 직접 호출
    const repository = new DrizzleImageAssetRepository();

    const images = await repository.findFollowingUserImages({
      userId: user.id,
      page: validatedRequest.page,
      perPage: validatedRequest.perPage,
    });

    return ok(images);
  } catch (error) {
    console.error('[browseFollowingFeedAction] Error:', error);
    return err(
      error instanceof Error
        ? error.message
        : 'Failed to browse following feed',
      { code: 'FETCH_FAILED' }
    );
  }
}

/**
 * 메타데이터 업데이트 Server Action
 *
 * Process Model: Scenario 6 - 메타데이터 편집
 */
export async function updateImageMetadataAction(
  request: unknown
): Promise<ActionResult<ImageAsset>> {
  // 1. Trust Boundary 검증
  const parseResult = UpdateImageMetadataRequestSchema.safeParse(request);

  if (!parseResult.success) {
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 확인
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('Unauthorized', { code: 'UNAUTHORIZED' });
    }

    return await updateImageMetadataInternal(validatedRequest, user.id);
  } catch (error) {
    console.error('[updateImageMetadataAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Internal server error',
      { code: 'INTERNAL_ERROR' }
    );
  }
}

async function updateImageMetadataInternal(
  request: UpdateImageMetadataRequest,
  userId: string
): Promise<ActionResult<ImageAsset>> {
  try {
    // 의존성 주입
    const repository = new DrizzleImageAssetRepository();
    const service = new ImageAssetService(repository);

    // Command 생성
    const command = {
      imageAssetId: request.imageAssetId,
      title: request.title,
      description: request.description,
      tags: request.tags,
      category: request.category,
    };

    // Service 호출
    const result = await service.updateMetadata(command, userId);

    if (result.isError()) {
      return err(result.error.message, {
        code: result.error.code,
      });
    }

    return ok(result.value);
  } catch (error) {
    return err(
      error instanceof Error ? error.message : 'Failed to update metadata',
      { code: 'UPDATE_FAILED' }
    );
  }
}

/**
 * 이미지 사용 기록 Server Action
 *
 * Process Model: Scenario 4 - 이미지를 블록에 적용
 */
export async function recordImageUsageAction(
  request: unknown
): Promise<ActionResult<void>> {
  // 1. Trust Boundary 검증
  const { RecordImageUsageRequestSchema } =
    await import('../shared/schemas/image-asset-usage.schemas');
  const parseResult = RecordImageUsageRequestSchema.safeParse(request);

  if (!parseResult.success) {
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 확인
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('Unauthorized', { code: 'UNAUTHORIZED' });
    }

    // 3. 이미지 사용 기록
    const { adminDb } = await import('@/db');
    const { imageAssetUsage } =
      await import('@/db/schemas/image-app-space-schema');

    try {
      await adminDb.insert(imageAssetUsage).values({
        image_asset_id: validatedRequest.imageAssetId,
        block_id: validatedRequest.blockId,
        page_id: validatedRequest.pageId,
      });

      return ok(undefined);
    } catch (dbError) {
      // ✅ Silent fail: Usage tracking은 필수가 아님
      // Foreign key constraint 에러 등이 발생해도 무시
      console.warn(
        '[recordImageUsageAction] Failed to record usage (non-critical):',
        {
          blockId: validatedRequest.blockId,
          imageAssetId: validatedRequest.imageAssetId,
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
        }
      );

      // 실패해도 성공으로 처리 (tracking은 optional)
      return ok(undefined);
    }
  } catch (error) {
    console.error('[recordImageUsageAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to record usage',
      { code: 'RECORD_FAILED' }
    );
  }
}

/**
 * 공개 설정 변경 Server Action
 *
 * Process Model: Scenario 7 - Public 전환
 */
export async function changeImageVisibilityAction(
  request: unknown
): Promise<ActionResult<ImageAsset>> {
  // 1. Trust Boundary 검증
  const parseResult = ChangeImageVisibilityRequestSchema.safeParse(request);

  if (!parseResult.success) {
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 확인
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return err('Unauthorized', { code: 'UNAUTHORIZED' });
    }

    return await changeImageVisibilityInternal(validatedRequest, user.id);
  } catch (error) {
    console.error('[changeImageVisibilityAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Internal server error',
      { code: 'INTERNAL_ERROR' }
    );
  }
}

async function changeImageVisibilityInternal(
  request: ChangeImageVisibilityRequest,
  userId: string
): Promise<ActionResult<ImageAsset>> {
  try {
    // 의존성 주입
    const repository = new DrizzleImageAssetRepository();
    const service = new ImageAssetService(repository);

    // Command 생성
    const command = {
      imageAssetId: request.imageAssetId,
      isPublic: request.isPublic,
      title: request.title,
      category: request.category,
    };

    // Service 호출
    const result = await service.changeVisibility(command, userId);

    if (result.isError()) {
      return err(result.error.message, {
        code: result.error.code,
      });
    }

    return ok(result.value);
  } catch (error) {
    return err(
      error instanceof Error ? error.message : 'Failed to change visibility',
      { code: 'UPDATE_FAILED' }
    );
  }
}

/**
 * Workspace 이미지 조회 Action
 *
 * 의존성:
 * - workspace-management: isWorkspaceMember()
 * - image-app-space: DrizzleImageAssetRepository
 */
export async function getWorkspaceImagesAction(
  request: unknown
): Promise<ActionResult<ImageAsset[]>> {
  // 1. Trust Boundary 검증
  const parseResult = GetWorkspaceImagesRequestSchema.safeParse(request);
  if (!parseResult.success) {
    console.warn('[Security] Invalid request to getWorkspaceImagesAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 확인
  try {
    const user = await getAuthenticatedUser();

    // 3. 워크스페이스 멤버십 확인
    const isMember = await isWorkspaceMember(
      validatedRequest.workspaceId,
      user.id
    );

    if (!isMember) {
      return err('Not a workspace member', {
        code: 'ACCESS_DENIED',
        meta: { workspaceId: validatedRequest.workspaceId },
      });
    }

    // 4. Service Layer 호출
    const repository = new DrizzleImageAssetRepository();
    const service = new ImageAssetService(repository);

    const result = await service.getWorkspaceImages(
      validatedRequest.workspaceId,
      validatedRequest.filterType,
      validatedRequest.page,
      validatedRequest.perPage
    );

    if (result.isError()) {
      return err(result.error.message, {
        code: result.error.code,
      });
    }

    // 5. Signed URL 확인 및 만료된 경우만 재생성
    const storageService = new AdminStorageService();
    const imageRepository = new DrizzleImageAssetRepository();

    const imagesWithSignedUrls = await Promise.all(
      result.value.map(async image => {
        try {
          // 외부 URL (Unsplash 등)은 그대로 반환
          if (
            image.image_url.startsWith('http://') ||
            image.image_url.startsWith('https://')
          ) {
            return {
              ...image,
              signed_url: image.image_url, // 외부 URL은 signed_url로도 사용
            };
          }

          // signed_url_expires_at으로 만료 확인
          const isExpired = isSignedUrlExpiredByDate(
            image.signed_url_expires_at
          );

          if (!isExpired && image.signed_url) {
            // 만료되지 않았으면 캐시된 signed_url 반환
            return {
              ...image,
              signed_url: image.signed_url,
            };
          }

          // 만료되었으면 새 signed URL 생성 (image_url은 storage path)
          const signedUrl = await storageService.createImageSignedUrl(
            image.image_url, // storage path
            image.workspace_id,
            user.id,
            image.is_public
          );

          const expiresAt = getSignedUrlExpiresAt();

          // ✅ signed_url 필드에 업데이트 (image_url은 storage path 유지)
          await imageRepository.updateSignedUrl(image.id, signedUrl, expiresAt);

          return {
            ...image,
            signed_url: signedUrl,
            signed_url_expires_at: expiresAt,
          };
        } catch (error) {
          console.error(
            `[getWorkspaceImagesAction] Failed to refresh signed URL for image ${image.id}:`,
            error
          );
          // 에러 시 기존 signed_url 또는 image_url 유지
          return {
            ...image,
            signed_url: image.signed_url || image.image_url,
          };
        }
      })
    );

    return ok(imagesWithSignedUrls);
  } catch (error) {
    console.error('[getWorkspaceImagesAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to get workspace images',
      { code: 'FETCH_FAILED' }
    );
  }
}

/**
 * 이미지 URL 조회 Action
 *
 * 의존성:
 * - storage: AdminStorageService
 * - workspace-management: isWorkspaceMember (AdminStorageService 내부)
 *
 * 반환: signed URL + 메타데이터 (블록에 캐싱용)
 *
 * ✅ 경쟁 조건 방지:
 * - SSOT(image_assets.image_url)에서 만료 확인
 * - 만료되지 않았으면 기존 URL 재사용
 * - 만료되었을 때만 재생성 후 SSOT 업데이트
 */
export async function getImageUrlAction(request: unknown): Promise<
  ActionResult<{
    url: string;
    metadata: {
      unsplashAuthorName?: string;
      unsplashAuthorLink?: string;
      title?: string;
      description?: string;
    };
  }>
> {
  // 1. Trust Boundary 검증
  const parseResult = GetImageUrlRequestSchema.safeParse(request);
  if (!parseResult.success) {
    console.warn('[Security] Invalid request to getImageUrlAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 확인
  try {
    const user = await getAuthenticatedUser();

    // 3. 이미지 조회 (SSOT)
    const repository = new DrizzleImageAssetRepository();
    const imageAsset = await repository.findById(validatedRequest.imageAssetId);

    if (!imageAsset) {
      return err('Image not found', {
        code: 'NOT_FOUND',
        meta: { imageAssetId: validatedRequest.imageAssetId },
      });
    }

    // 4. ✅ 외부 URL 체크 (Unsplash 등) - 워크스페이스 멤버십 체크 불필요
    if (
      imageAsset.image_url.startsWith('http://') ||
      imageAsset.image_url.startsWith('https://')
    ) {
      // 메타데이터 추출 (공통 로직)
      const metadata = extractImageMetadata(imageAsset);

      return ok({ url: imageAsset.image_url, metadata });
    }

    // 5. 워크스페이스 멤버십 확인 (Private 이미지인 경우)
    if (!imageAsset.is_public) {
      const isMember = await isWorkspaceMember(
        imageAsset.workspace_id,
        user.id
      );

      if (!isMember) {
        return err(getAuthErrorMessage('NOT_WORKSPACE_MEMBER'), {
          code: 'NOT_WORKSPACE_MEMBER',
          meta: { workspaceId: imageAsset.workspace_id },
        });
      }
    }

    // 6. ✅ signed_url_expires_at으로 만료 확인 (경쟁 조건 방지)
    const isExpired = isSignedUrlExpiredByDate(
      imageAsset.signed_url_expires_at,
      60
    );

    if (!isExpired && imageAsset.signed_url) {
      // 메타데이터 추출
      const metadata = extractImageMetadata(imageAsset);

      // ✅ 캐시된 signed_url 재사용 (경쟁 조건 없음)
      return ok({ url: imageAsset.signed_url, metadata });
    }

    // 7. ✅ 만료되었을 때만 새로운 Signed URL 생성
    const storageService = new AdminStorageService();

    try {
      const newSignedUrl = await storageService.createImageSignedUrl(
        imageAsset.image_url, // storage_path (항상 storage path)
        imageAsset.workspace_id,
        user.id,
        imageAsset.is_public
      );

      const expiresAt = getSignedUrlExpiresAt();

      // 8. ✅ signed_url 필드 업데이트 (image_url은 storage path 유지)
      await repository.updateSignedUrl(imageAsset.id, newSignedUrl, expiresAt);

      // 메타데이터 추출
      const metadata = extractImageMetadata(imageAsset);

      return ok({ url: newSignedUrl, metadata });
    } catch (storageError) {
      console.error('[getImageUrlAction] Storage error:', storageError);
      return err(
        storageError instanceof Error
          ? storageError.message
          : 'Failed to get image URL',
        {
          code: 'ACCESS_DENIED',
          meta: { imageAssetId: validatedRequest.imageAssetId },
        }
      );
    }
  } catch (error) {
    console.error('[getImageUrlAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to get image URL',
      { code: 'INTERNAL_ERROR' }
    );
  }
}

/**
 * Unsplash 이미지 저장/조회 Action
 *
 * photoId로 중복 체크 후 생성 또는 기존 것 반환
 */
export async function createOrGetUnsplashImageAssetAction(
  request: unknown
): Promise<ActionResult<ImageAsset>> {
  // 1. Trust Boundary 검증
  const { CreateOrGetUnsplashImageAssetRequestSchema } =
    await import('../shared/schemas/image-asset.schemas');
  const parseResult =
    CreateOrGetUnsplashImageAssetRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn(
      '[Security] Invalid request to createOrGetUnsplashImageAssetAction',
      {
        errors: parseResult.error.issues,
        timestamp: new Date().toISOString(),
      }
    );

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 확인
  try {
    const user = await getAuthenticatedUser();

    // 3. 워크스페이스 멤버십 확인
    const isMember = await isWorkspaceMember(
      validatedRequest.workspaceId,
      user.id
    );

    if (!isMember) {
      return err('Not a workspace member', {
        code: 'ACCESS_DENIED',
        meta: { workspaceId: validatedRequest.workspaceId },
      });
    }

    // 4. photoId로 기존 이미지 검색
    const imageRepository = new DrizzleImageAssetRepository();
    const existing = await imageRepository.findByUnsplashPhotoId(
      validatedRequest.photoId
    );

    if (existing) {
      // use_count 증가
      await imageRepository.incrementUseCount(existing.id);

      return ok(existing);
    }

    // 5. 없으면 새로 생성
    const newImageAsset = await imageRepository.create({
      asset_type: 'unsplash',
      image_url: validatedRequest.imageUrl,
      width: validatedRequest.width,
      height: validatedRequest.height,
      metadata: {
        photoId: validatedRequest.photoId,
        authorName: validatedRequest.authorName,
        authorUsername: validatedRequest.authorUsername,
        authorLink: validatedRequest.authorLink,
      },
      title: validatedRequest.altDescription || 'Unsplash Image',
      description: validatedRequest.altDescription || null,
      created_by: user.id,
      workspace_id: validatedRequest.workspaceId,
      is_public: false, // 기본은 private
      use_count: 1, // 첫 사용
    });

    return ok(newImageAsset);
  } catch (error) {
    console.error('[createOrGetUnsplashImageAssetAction] Error:', error);
    return err(
      error instanceof Error
        ? error.message
        : 'Failed to create/get Unsplash image',
      { code: 'INTERNAL_ERROR' }
    );
  }
}
