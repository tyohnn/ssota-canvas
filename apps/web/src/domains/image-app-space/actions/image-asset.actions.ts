/**
 * Image Asset Server Actions
 *
 * Technical Specification 참조: 04-technical-specification.md
 * Trust Boundary 패턴 적용
 */

'use server';

import { createClient } from '@/utils/supabase/server';
import { ActionResult, err, ok } from '@/lib/action-result';
import { DrizzleImageAssetRepository } from '../backend/repositories/implementations/drizzle-image-asset.repository';
import { ImageAssetService } from '../backend/services/image-asset.service';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';
import type { ImageAssetWithStats } from '../backend/repositories/interfaces/image-asset.repository.interface';
import {
  CreateImageAssetRequestSchema,
  type CreateImageAssetRequest,
  UpdateImageMetadataRequestSchema,
  type UpdateImageMetadataRequest,
  ChangeImageVisibilityRequestSchema,
  type ChangeImageVisibilityRequest,
  BrowseCommunityFeedRequestSchema,
  type BrowseCommunityFeedRequest,
  BrowseFollowingFeedRequestSchema,
  type BrowseFollowingFeedRequest,
} from '../shared/schemas/image-asset.schemas';

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
  const { RecordImageUsageRequestSchema } = await import(
    '../shared/schemas/image-asset-usage.schemas'
  );
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
    const { imageAssetUsage } = await import(
      '@/db/schemas/image-app-space-schema'
    );

    await adminDb.insert(imageAssetUsage).values({
      image_asset_id: validatedRequest.imageAssetId,
      block_id: validatedRequest.blockId,
      page_id: validatedRequest.pageId,
    });

    return ok(undefined);
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
