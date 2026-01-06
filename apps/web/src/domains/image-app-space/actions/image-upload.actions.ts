/**
 * Image Upload Server Actions
 *
 * 이미지 업로드 Server Actions
 * - Trust Boundary 패턴 적용
 * - ImageUploadService 오케스트레이션
 */

'use server';

import { z } from 'zod';
import { ActionResult, err, ok } from '@/lib';
import { getAuthenticatedUser } from '@/domains/common/auth/helpers';
import {
  isAuthenticationError,
  getAuthErrorMessage,
} from '@/domains/common/auth/error';
import { isWorkspaceMember } from '@/domains/workspace-management/backend/services/workspace-membership.service';
import { logServerActionError } from '@/utils/dev-logger';
import { ImageUploadService } from '../backend/services/image-upload.service';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';

/**
 * 이미지 업로드 요청 스키마
 *
 * 클라이언트에서 이미지 메타데이터를 추출하여 전달
 * (서버에서 메타데이터 추출은 추가 라이브러리 필요)
 */
const UploadImageRequestSchema = z.object({
  /** Base64 인코딩된 파일 데이터 */
  fileBase64: z.string().min(1, 'File data is required'),

  /** 파일명 */
  fileName: z.string().min(1, 'File name is required'),

  /** 파일 크기 (bytes) */
  fileSize: z.number().positive('File size must be positive'),

  /** MIME 타입 */
  mimeType: z
    .string()
    .regex(/^image\/(jpeg|png|gif|webp)$/, 'Invalid image type'),

  /** 워크스페이스 ID */
  workspaceId: z.uuid('Invalid workspace ID'),

  /** 이미지 너비 (optional) */
  width: z.number().positive().optional(),

  /** 이미지 높이 (optional) */
  height: z.number().positive().optional(),
});

export type UploadImageRequest = z.infer<typeof UploadImageRequestSchema>;

/**
 * 이미지 업로드 Server Action
 *
 * Trust Boundary:
 * - unknown 입력 → Zod 검증 → 서비스 호출
 *
 * 플로우:
 * 1. Trust Boundary 검증 (Zod)
 * 2. 인증 확인
 * 3. Base64 → Buffer 변환
 * 4. ImageUploadService 호출
 *    - Storage 업로드
 *    - DB 저장
 *    - Signed URL 생성
 * 5. ImageAsset 반환
 *
 * @param request - 업로드 요청 (unknown)
 * @returns ImageAsset (signed URL 포함)
 */
export async function uploadImageAction(
  request: unknown
): Promise<ActionResult<ImageAsset>> {
  // 1. Trust Boundary 검증
  const parseResult = UploadImageRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to uploadImageAction', {
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
      return err(getAuthErrorMessage('NOT_WORKSPACE_MEMBER'), {
        code: 'NOT_WORKSPACE_MEMBER',
        meta: { workspaceId: validatedRequest.workspaceId },
      });
    }

    // 4. Internal 함수 호출
    return await uploadImageInternal(validatedRequest, user.id);
  } catch (error) {
    // 인증 실패 처리 (예상 가능한 에러 - 로깅하지 않음)
    if (isAuthenticationError(error)) {
      return err(getAuthErrorMessage('UNAUTHORIZED'), { code: 'UNAUTHORIZED' });
    }

    // 예상치 못한 에러만 로깅 (프로덕션에서도 추적 필요)
    logServerActionError('uploadImageAction', error, { request });

    return err(
      error instanceof Error ? error.message : 'Internal server error',
      { code: 'INTERNAL_ERROR' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function uploadImageInternal(
  request: UploadImageRequest,
  userId: string
): Promise<ActionResult<ImageAsset>> {
  try {
    // 1. Base64 → Buffer 변환
    const base64Data = request.fileBase64.replace(
      /^data:image\/\w+;base64,/,
      ''
    );
    const buffer = Buffer.from(base64Data, 'base64');

    // 2. Service 호출
    const service = new ImageUploadService();
    const result = await service.uploadImage({
      assetType: 'user-upload', // 사용자 업로드
      file: buffer,
      fileName: request.fileName,
      fileSize: request.fileSize,
      mimeType: request.mimeType,
      workspaceId: request.workspaceId,
      userId,
      width: request.width,
      height: request.height,
    });

    if (result.isError()) {
      // Service 레이어 에러는 이미 처리된 에러이므로 warn 레벨
      console.warn('[uploadImageInternal] Service error', {
        action: 'uploadImageInternal',
        errorCode: result.error.code,
        errorMessage: result.error.message,
      });

      return err(result.error.message, {
        code: result.error.code,
        meta: { originalError: result.error.originalError },
      });
    }

    return ok(result.value);
  } catch (error) {
    // 예상치 못한 에러만 로깅
    logServerActionError('uploadImageInternal', error, {
      workspaceId: request.workspaceId,
      userId,
    });

    return err(
      error instanceof Error ? error.message : 'Failed to upload image',
      { code: 'UPLOAD_FAILED' }
    );
  }
}
