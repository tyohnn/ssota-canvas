/**
 * Image Upload Service
 *
 * 이미지 업로드 오케스트레이션 서비스
 * - Storage 업로드 → DB 저장 → Signed URL 생성의 전체 플로우 조정
 *
 * 의존성:
 * - ImageAssetService: DB 저장
 * - AdminStorageService: Storage 업로드 및 Signed URL 생성
 *
 * 사용처:
 * - uploadImageAction (Server Action)
 */

import { supabaseAdmin } from '@/utils/supabase/server';
import { generateAssetPath } from '@/domains/storage/lib/path-generator';
import { ImageAssetService } from './image-asset.service';
import { AdminStorageService } from '@/domains/storage/backend/services/admin-storage.service';
import { DrizzleImageAssetRepository } from '../repositories/implementations/drizzle-image-asset.repository';
import { Result } from '@/utils/result';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';
import type { UploadImageCommand } from '../../shared/commands/image-asset.commands';

/**
 * 이미지 메타데이터
 */
export interface ImageMetadata {
  width: number;
  height: number;
}

/**
 * Image Upload Service Error
 */
export class ImageUploadError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

/**
 * Image Upload Service
 *
 * 이미지 업로드 전체 플로우를 조정하는 서비스
 */
export class ImageUploadService {
  private imageAssetService: ImageAssetService;
  private storageService: AdminStorageService;

  constructor() {
    const repository = new DrizzleImageAssetRepository();
    this.imageAssetService = new ImageAssetService(repository);
    this.storageService = new AdminStorageService();
  }

  /**
   * 이미지 업로드 및 DB 저장
   *
   * 플로우:
   * 1. Storage 경로 생성
   * 2. Supabase Storage에 업로드
   * 3. 이미지 메타데이터 추출 (width, height)
   * 4. DB에 ImageAsset 생성 (storage path로)
   * 5. Signed URL 생성
   * 6. ImageAsset 반환 (signed URL 포함)
   *
   * @param command - 업로드 Command
   * @returns ImageAsset (signed URL 포함)
   */
  async uploadImage(
    command: UploadImageCommand
  ): Promise<Result<ImageAsset, ImageUploadError>> {
    try {
      // 1. Storage 경로 생성 (워크스페이스 중심)
      const storagePath = generateAssetPath(
        command.workspaceId,
        command.fileName
      );

      console.log('[ImageUploadService] Uploading to storage:', {
        bucket: 'image-assets',
        path: storagePath,
        fileSize: command.fileSize,
      });

      // 2. Supabase Storage에 업로드 (Admin Client 사용 - RLS 우회)
      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from('image-assets')
          .upload(storagePath, command.file, {
            contentType: command.mimeType,
            cacheControl: '3600',
            upsert: false,
          });

      if (uploadError) {
        console.error(
          '[ImageUploadService] Storage upload error:',
          uploadError
        );
        return Result.error(
          new ImageUploadError(
            'STORAGE_UPLOAD_FAILED',
            `Failed to upload image: ${uploadError.message}`,
            uploadError
          )
        );
      }

      console.log(
        '[ImageUploadService] Storage upload successful:',
        uploadData
      );

      // 3. 이미지 메타데이터 추출
      let metadata: ImageMetadata | null = null;
      try {
        metadata = await this.extractImageMetadata(command.file);
      } catch (error) {
        console.warn('[ImageUploadService] Failed to extract metadata:', error);
        // 메타데이터 추출 실패는 치명적이지 않으므로 계속 진행
      }

      // 4. DB 저장 (storage path로 먼저 생성)
      console.log('[ImageUploadService] Saving to image_assets table:', {
        assetType: command.assetType,
        imageUrl: storagePath,
        workspaceId: command.workspaceId,
        width: command.width ?? metadata?.width,
        height: command.height ?? metadata?.height,
      });

      const createResult = await this.imageAssetService.createImageAsset({
        assetType: command.assetType,
        imageUrl: storagePath, // Storage path (임시)
        workspaceId: command.workspaceId,
        createdBy: command.userId,
        width: command.width ?? metadata?.width,
        height: command.height ?? metadata?.height,
        fileSize: command.fileSize,
        mimeType: command.mimeType,
        prompt: command.prompt,
        negativePrompt: command.negativePrompt,
        metadata: command.metadata,
      });

      if (createResult.isError()) {
        console.error(
          '[ImageUploadService] DB save error:',
          createResult.error
        );
        return Result.error(
          new ImageUploadError(
            'DB_SAVE_FAILED',
            `Failed to save image metadata: ${createResult.error.message}`,
            createResult.error
          )
        );
      }

      const imageAsset = createResult.value;

      console.log(
        '[ImageUploadService] Successfully saved to image_assets:',
        imageAsset.id
      );

      // 5. Signed URL 생성
      try {
        console.log('[ImageUploadService] Generating signed URL for:', {
          path: storagePath,
          workspaceId: command.workspaceId,
          userId: command.userId,
        });

        const signedUrl = await this.storageService.createImageSignedUrl(
          storagePath,
          command.workspaceId,
          command.userId,
          false // isPublic (기본값: private)
        );

        console.log('[ImageUploadService] Generated signed URL:', signedUrl);

        // 6. ImageAsset에 signed URL 포함하여 반환
        return Result.success({
          ...imageAsset,
          image_url: signedUrl,
        });
      } catch (error) {
        console.warn(
          '[ImageUploadService] Failed to generate signed URL, using storage path:',
          error
        );
        // Signed URL 생성 실패 시 storage path 그대로 반환
        return Result.success(imageAsset);
      }
    } catch (error) {
      console.error('[ImageUploadService] Unexpected error:', error);
      return Result.error(
        new ImageUploadError(
          'UPLOAD_FAILED',
          error instanceof Error ? error.message : 'Failed to upload image',
          error
        )
      );
    }
  }

  /**
   * 이미지 메타데이터 추출 (width, height)
   *
   * Browser 환경에서는 Image 객체 사용
   * Node.js 환경에서는 sharp 등의 라이브러리 필요 (TODO)
   *
   * @param file - 이미지 파일
   * @returns 이미지 메타데이터
   */
  private async extractImageMetadata(
    file: Buffer | Blob
  ): Promise<ImageMetadata> {
    // Server-side에서는 sharp 사용 (TODO: 설치 필요)
    // 현재는 클라이언트에서 메타데이터를 보내도록 함
    throw new Error('Metadata extraction not implemented on server side');

    // 참고: 클라이언트에서의 구현
    // const img = new Image();
    // await new Promise<void>((resolve, reject) => {
    //   img.onload = () => resolve();
    //   img.onerror = () => reject(new Error('Failed to load image'));
    //   img.src = URL.createObjectURL(file);
    // });
    // URL.revokeObjectURL(img.src);
    // return {
    //   width: img.naturalWidth,
    //   height: img.naturalHeight,
    // };
  }
}
