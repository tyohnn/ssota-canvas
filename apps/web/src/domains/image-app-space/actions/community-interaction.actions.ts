/**
 * Community Interaction Server Actions
 *
 * Technical Specification 참조: 04-technical-specification.md
 * 커뮤니티 상호작용 (좋아요, 북마크, 팔로우) Server Actions
 */

'use server';

import { ActionResult, err, ok } from '@/lib';
import { createClient } from '@/utils/supabase/server';

import { DrizzleCommunityInteractionRepository } from '../backend/repositories/implementations/drizzle-community-interaction.repository';
import { CommunityInteractionService } from '../backend/services/community-interaction.service';
import {
  BookmarkImageRequestSchema,
  FollowUserRequestSchema,
  LikeImageRequestSchema,
} from '../shared/schemas/image-asset.schemas';

/**
 * 좋아요 토글 Server Action
 *
 * Process Model: Scenario 3 - Community Feed 상호작용
 */
export async function toggleLikeAction(
  request: unknown
): Promise<ActionResult<{ liked: boolean }>> {
  // 1. Trust Boundary 검증
  const parseResult = LikeImageRequestSchema.safeParse(request);

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

    // 3. Service 호출
    const repository = new DrizzleCommunityInteractionRepository();
    const service = new CommunityInteractionService(repository);

    const command = {
      imageAssetId: validatedRequest.imageAssetId,
    };

    const result = await service.toggleLike(command, user.id);

    if (result.isError()) {
      return err(result.error.message, {
        code: result.error.code,
      });
    }

    return ok(result.value);
  } catch (error) {
    console.error('[toggleLikeAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to toggle like',
      { code: 'TOGGLE_FAILED' }
    );
  }
}

/**
 * 북마크 토글 Server Action
 *
 * Process Model: Scenario 2 - Unsplash 이미지 북마크
 *
 * ⚠️ Unsplash 이미지 북마크 시:
 * 1. 먼저 image_assets에 ImageAsset 생성 (없으면)
 * 2. 그 다음 image_bookmarks에 북마크 추가
 * 3. Unsplash 다운로드 트래킹 API 호출
 */
export async function toggleBookmarkAction(
  request: unknown
): Promise<ActionResult<{ bookmarked: boolean }>> {
  // 1. Trust Boundary 검증
  const parseResult = BookmarkImageRequestSchema.safeParse(request);

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

    // 3. Service 호출
    const repository = new DrizzleCommunityInteractionRepository();
    const service = new CommunityInteractionService(repository);

    const command = {
      imageAssetId: validatedRequest.imageAssetId,
    };

    const result = await service.toggleBookmark(command, user.id);

    if (result.isError()) {
      return err(result.error.message, {
        code: result.error.code,
      });
    }

    // 4. Unsplash 이미지인 경우 다운로드 트래킹
    // (imageAssetId가 'unsplash:' prefix로 시작하면 Unsplash)
    if (validatedRequest.imageAssetId.startsWith('unsplash:')) {
      const unsplashId = validatedRequest.imageAssetId.replace('unsplash:', '');
      try {
        const { trackUnsplashDownloadAction } =
          await import('./image-search.actions');
        await trackUnsplashDownloadAction(unsplashId);
      } catch (error) {
        console.warn('[toggleBookmarkAction] Failed to track download:', error);
      }
    }

    return ok(result.value);
  } catch (error) {
    console.error('[toggleBookmarkAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to toggle bookmark',
      { code: 'TOGGLE_FAILED' }
    );
  }
}

/**
 * 팔로우 토글 Server Action
 *
 * Process Model: Scenario 3 - 크리에이터 팔로우
 */
export async function toggleFollowAction(
  request: unknown
): Promise<ActionResult<{ following: boolean }>> {
  // 1. Trust Boundary 검증
  const parseResult = FollowUserRequestSchema.safeParse(request);

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

    // 3. Service 호출
    const repository = new DrizzleCommunityInteractionRepository();
    const service = new CommunityInteractionService(repository);

    const command = {
      followeeId: validatedRequest.followeeId,
    };

    const result = await service.toggleFollow(command, user.id);

    if (result.isError()) {
      return err(result.error.message, {
        code: result.error.code,
      });
    }

    return ok(result.value);
  } catch (error) {
    console.error('[toggleFollowAction] Error:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to toggle follow',
      { code: 'TOGGLE_FAILED' }
    );
  }
}

/**
 * 조회수 기록 Server Action
 *
 * Process Model: 이미지 상세 조회 시
 */
export async function recordImageViewAction(
  imageAssetId: string,
  sessionId?: string
): Promise<ActionResult<void>> {
  try {
    // 인증 확인 (Optional - 익명 사용자도 허용)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Service 호출
    const repository = new DrizzleCommunityInteractionRepository();
    const service = new CommunityInteractionService(repository);

    const result = await service.recordView(
      imageAssetId,
      user?.id ?? null,
      sessionId
    );

    if (result.isError()) {
      // Silent fail - 조회수는 중요하지 않음
      console.warn('[recordImageViewAction] Failed:', result.error.message);
      return ok(undefined);
    }

    return ok(undefined);
  } catch (error) {
    // Silent fail
    console.warn('[recordImageViewAction] Error:', error);
    return ok(undefined);
  }
}

// Re-export from image-asset.actions for convenience
// browseCommunityFeedAction과 browseFollowingFeedAction은
// @/domains/image-app-space/actions/image-asset.actions 에서 직접 import하세요
