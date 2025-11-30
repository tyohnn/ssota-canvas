/**
 * Generated Image Upload Service
 *
 * AI로 생성된 이미지를 Supabase Storage에 업로드하는 서비스
 *
 * 도메인: image-app-space
 * (storage 도메인에서 이동 - 이미지 자산 관리 책임)
 */

import { createClient } from '@/utils/supabase/server';
import { StorageBucket } from '@/domains/storage/types/storage.types';
import { createHash } from 'crypto';
import { randomUUID } from 'crypto';

/**
 * 생성된 이미지 업로드 옵션
 */
export interface UploadGeneratedAssetOptions {
  /** Base64 이미지 데이터 */
  base64: string;

  /** MIME 타입 (예: image/png) */
  mimeType: string;

  /** 조직 ID */
  orgId: string;

  /** 워크스페이스 ID */
  workspaceId: string;

  /** 페이지 ID */
  pageId: string;

  /** 블록 ID */
  blockId: string;

  /** 프롬프트 해시 (캐싱용) */
  promptHash?: string;

  /** 모델 ID */
  modelId?: string;
}

/**
 * 업로드 결과
 */
export interface UploadGeneratedAssetResult {
  /** Signed URL */
  url: string;

  /** Storage 경로 */
  path: string;

  /** 이미지 너비 (있는 경우) */
  width?: number;

  /** 이미지 높이 (있는 경우) */
  height?: number;

  /** MIME 타입 */
  mimeType: string;
}

/**
 * 생성된 이미지를 Supabase Storage에 업로드
 *
 * 워크스페이스 중심 IMAGE_ASSETS 버킷 사용
 * 경로 구조: {workspaceId}/{YYYYMMDD}/{generated-promptHash-modelId-uuid}.{ext}
 *
 * @param options - 업로드 옵션
 * @returns 업로드 결과
 */
export async function uploadGeneratedImageToStorage(
  options: UploadGeneratedAssetOptions
): Promise<UploadGeneratedAssetResult> {
  const supabase = await createClient();

  // Base64를 Buffer로 변환
  const base64Data = options.base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // 파일 확장자 결정
  const ext = options.mimeType.split('/')[1] || 'png';

  // 경로 생성 (워크스페이스 중심)
  const date = new Date().toISOString().split('T')[0]!.replace(/-/g, ''); // YYYYMMDD
  const uuid = randomUUID();
  const promptHash =
    options.promptHash ||
    createHash('md5')
      .update(options.base64.slice(0, 100))
      .digest('hex')
      .slice(0, 8);
  const modelId = options.modelId
    ? options.modelId.replace(/[^a-zA-Z0-9]/g, '-')
    : 'unknown';

  // 파일명: generated-{promptHash}-{modelId}-{uuid}.{ext}
  const fileName = `generated-${promptHash}-${modelId}-${uuid}.${ext}`;

  // 경로: {workspaceId}/{YYYYMMDD}/{fileName}
  const path = `${options.workspaceId}/${date}/${fileName}`;

  // Supabase Storage에 업로드 (IMAGE_ASSETS 버킷)
  const { data, error } = await supabase.storage
    .from(StorageBucket.IMAGE_ASSETS)
    .upload(path, buffer, {
      contentType: options.mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload generated image: ${error.message}`);
  }

  // Signed URL 생성 (1년 만료)
  const ONE_YEAR_IN_SECONDS = 31536000;
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(StorageBucket.IMAGE_ASSETS)
    .createSignedUrl(path, ONE_YEAR_IN_SECONDS);

  if (signedUrlError || !signedUrlData) {
    throw new Error(`Failed to create signed URL: ${signedUrlError?.message}`);
  }

  // 이미지 크기 추출 (선택적, sharp 등 라이브러리 필요 시 추가)
  // 현재는 기본값 반환

  return {
    url: signedUrlData.signedUrl,
    path,
    mimeType: options.mimeType,
  };
}
