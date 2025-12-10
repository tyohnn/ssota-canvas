/**
 * Image Upload Hook
 *
 * 이미지 업로드 공통 로직
 * - ImageUploadPlaceholder와 ImageChangeToolbarItem에서 공유
 */

'use client';

import { useCallback, useState } from 'react';
import { uploadImageAction } from '@/domains/image-app-space/actions/image-upload.actions';
import { fileToBase64, extractImageMetadata } from '../utils/image-file.utils';

/**
 * 업로드 성공 시 반환되는 이미지 properties
 */
export interface ImageUploadResult {
  imageAssetId: string;
  imageUrl: string;
  imageSource: 'user-upload';
  caption: string;
  alt: string;
  unsplashAuthorName: null;
  unsplashAuthorLink: null;
  [key: string]: unknown; // Record<string, unknown> 호환성
}

export interface UseImageUploadOptions {
  workspaceId: string;
  onSuccess: (
    properties: ImageUploadResult,
    metadata?: { width: number; height: number }
  ) => Promise<void>;
  onError?: (error: Error) => void;
}

export interface UseImageUploadResult {
  uploadImage: (file: File) => Promise<void>;
  isUploading: boolean;
}

/**
 * 이미지 업로드 공통 훅
 *
 * @param options - 업로드 옵션
 * @returns uploadImage 함수와 isUploading 상태
 *
 * @example
 * ```tsx
 * const { uploadImage, isUploading } = useImageUpload({
 *   workspaceId,
 *   onSuccess: async (props) => {
 *     await updateProperties(blockId, props, nodeData);
 *   },
 * });
 * ```
 */
export function useImageUpload({
  workspaceId,
  onSuccess,
  onError,
}: UseImageUploadOptions): UseImageUploadResult {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(
    async (file: File) => {
      if (isUploading) return;

      setIsUploading(true);

      try {
        // 1. 이미지 메타데이터 추출 (클라이언트)
        const metadata = await extractImageMetadata(file);

        // 2. 파일을 Base64로 변환
        const base64 = await fileToBase64(file);

        // 3. Server Action으로 업로드
        const result = await uploadImageAction({
          fileBase64: base64,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          workspaceId,
          width: metadata.width,
          height: metadata.height,
        });

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        const imageAsset = result.data;

        // 4. 성공 콜백 호출 (메타데이터 포함)
        await onSuccess(
          {
          imageAssetId: imageAsset.id,
          imageUrl: imageAsset.image_url,
          imageSource: 'user-upload',
          // 기존 메타데이터 제거
          caption: '',
          alt: '',
          unsplashAuthorName: null,
          unsplashAuthorLink: null,
          },
          metadata
        );
      } catch (error) {
        console.error('[useImageUpload] Upload failed:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
        // TODO: toast.error('이미지 업로드에 실패했습니다.')
      } finally {
        setIsUploading(false);
      }
    },
    [workspaceId, onSuccess, onError, isUploading]
  );

  return {
    uploadImage,
    isUploading,
  };
}
