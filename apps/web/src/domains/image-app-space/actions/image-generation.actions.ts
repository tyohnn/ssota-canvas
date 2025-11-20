/**
 * Generate Image Assets Server Action
 *
 * AI 이미지 생성 Server Action
 *
 * ⚠️ Migrated from block-management domain to image-app-space domain
 */

'use server';

import { ImageGenerationService } from '../backend/services/image-generation.service';
import { ActionResult, ok, err } from '@/lib/action-result';
import {
  GenerateImageRequestSchema,
  type GenerateImageRequest,
} from '../shared/dtos/requests/image-generation.requests';
import {
  getAuthenticatedUser,
  verifyAccess,
  type AuthenticatedUser,
} from '@/domains/common/auth/helpers';
import { getAuthErrorMessage } from '@/domains/common/auth/error';

/**
 * 이미지 생성 Server Action
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 * 5. Service 호출
 *
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @param pageId - 페이지 ID (Storage 경로용)
 * @param blockId - 블록 ID (Storage 경로용)
 * @returns ImageGenerationResult (성공) | Error (실패)
 */
export async function generateImageAssetsAction(
  request: unknown,
  pageId: string,
  blockId: string
): Promise<ActionResult<any>> {
  // 1. Runtime Validation
  const parseResult = GenerateImageRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to generateImageAssetsAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      issues: parseResult.error.issues,
    });
  }

  // 2. 검증된 데이터
  const validatedRequest = parseResult.data;

  // 3. 인증 확인
  try {
    const user = await getAuthenticatedUser();

    // 4. 조직 & 워크스페이스 권한 확인
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access denied', {
        userId: user.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 5. 검증 완료 - Internal 함수 호출
    return await generateImageAssetsInternal(
      validatedRequest,
      user,
      pageId,
      blockId
    );
  } catch (error) {
    console.error('[generateImageAssetsAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      {
        code: 'UNAUTHORIZED',
      }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * @param request - 검증된 요청
 * @param user - 인증된 사용자
 * @param pageId - 페이지 ID
 * @param blockId - 블록 ID
 */
async function generateImageAssetsInternal(
  request: GenerateImageRequest,
  user: AuthenticatedUser,
  pageId: string,
  blockId: string
): Promise<ActionResult<any>> {
  try {
    // Service 생성
    const imageGenerationService = new ImageGenerationService();

    // 이미지 생성 실행
    const result = await imageGenerationService.generate(
      request,
      user.id,
      pageId,
      blockId
    );

    return ok(result);
  } catch (error) {
    console.error('[generateImageAssetsAction] Service error:', error);

    return err(
      error instanceof Error ? error.message : 'Failed to generate images',
      {
        code: 'GENERATION_FAILED',
      }
    );
  }
}
