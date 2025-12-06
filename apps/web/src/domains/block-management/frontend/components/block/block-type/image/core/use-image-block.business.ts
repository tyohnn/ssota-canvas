/**
 * ImageBlock Business Logic Hook
 *
 * 비즈니스 로직만 관리 (API 호출, 파일 업로드 등)
 */

import { useCallback } from 'react';
import type { FileWithPreview } from '@workspace/ui/hooks/use-file-upload';
import { useBlockPropertyUpdate } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';
import { getImageUrlAction } from '@/domains/image-app-space/actions/image-asset.actions';
import { uploadImageAction } from '@/domains/image-app-space/actions/image-upload.actions';
import { refreshImageUrlAction } from '@/domains/storage/actions/storage.actions';
import { isSignedUrlExpired } from '@/domains/image-app-space/frontend/utils/signed-url.utils';
import { fileToBase64, extractImageMetadata } from '../utils/image-file.utils';
import type { ImageBlockBusinessLogic, ImageBlockUIState } from './types';
import type { ImageBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * Production 비즈니스 로직
 */
export function useImageBlockBusiness(
  nodeData: ImageBlockNodeData,
  uiState: ImageBlockUIState
): ImageBlockBusinessLogic {
  const { updateProperty, updateProperties } = useBlockPropertyUpdate();
  const { upload, isUploading } = useSupabaseStorage();

  /**
   * 이미지 URL 로딩 (캐싱 + 만료 체크)
   */
  const loadImageUrl = useCallback(
    async (
      imageAssetId: string | undefined,
      imageUrl: string | undefined,
      imageSource: string | undefined
    ) => {
      // 1. imageAssetId가 있으면 (새로운 시스템)
      if (imageAssetId) {
        // 1-0. ✅ 무한 루프 방지: 이미 로딩 중이거나 같은 assetId면 skip
        if (
          uiState.isLoadingUrlRef.current ||
          uiState.prevImageAssetIdRef.current === imageAssetId
        ) {
          return;
        }

        // 1-1. block.imageUrl이 있고 만료되지 않았으면 캐시 사용
        if (imageUrl && !isSignedUrlExpired(imageUrl)) {
          if (imageUrl !== uiState.prevImageUrlRef.current) {
            uiState.setIsLoading(true);
            uiState.setHasError(false);
            uiState.prevImageUrlRef.current = imageUrl;
          }
          uiState.setDisplayUrl(imageUrl);
          uiState.prevImageAssetIdRef.current = imageAssetId;
          uiState.setIsLoading(false);
          return;
        }

        // 1-2. 만료되었거나 없으면 asset에서 조회
        // ✅ 만료된 URL로 이미지 로드 방지 - displayUrl 먼저 초기화
        uiState.setDisplayUrl(undefined);
        // ✅ 로딩 플래그 설정
        uiState.isLoadingUrlRef.current = true;
        uiState.setIsLoading(true);
        uiState.setHasError(false);

        try {
          const result = await getImageUrlAction({ imageAssetId });

          if (result.success) {
            // ✅ displayUrl 먼저 설정 (즉시 표시)
            uiState.setDisplayUrl(result.data.url);
            uiState.prevImageUrlRef.current = result.data.url;
            uiState.prevImageAssetIdRef.current = imageAssetId;
            uiState.isLoadingUrlRef.current = false;
            uiState.setIsLoading(false);

            // ✅ block.properties에 업데이트 (캐싱) - 백그라운드 처리
            const propertiesToUpdate: Record<string, any> = {
              imageUrl: result.data.url,
            };

            // 메타데이터도 동기화
            if (result.data.metadata) {
              if (result.data.metadata.unsplashAuthorName) {
                propertiesToUpdate.unsplashAuthorName =
                  result.data.metadata.unsplashAuthorName;
              }
              if (result.data.metadata.unsplashAuthorLink) {
                propertiesToUpdate.unsplashAuthorLink =
                  result.data.metadata.unsplashAuthorLink;
              }
            }

            // 한번에 업데이트 (백그라운드)
            updateProperties(
              nodeData.blockId,
              propertiesToUpdate,
              nodeData
            ).catch(err => {
              console.error('[ImageBlock] Failed to update properties:', err);
            });
          } else {
            console.error(
              '[ImageBlock] Failed to get image URL:',
              result.error
            );
            uiState.setHasError(true);
            uiState.setDisplayUrl(undefined);
            uiState.isLoadingUrlRef.current = false;
            uiState.setIsLoading(false);
          }
        } catch (error) {
          console.error('[ImageBlock] Error getting image URL:', error);
          uiState.setHasError(true);
          uiState.setDisplayUrl(undefined);
          uiState.isLoadingUrlRef.current = false;
          uiState.setIsLoading(false);
        }
        return;
      }

      // 2. Legacy: imageUrl만 있는 경우
      if (imageUrl) {
        if (imageUrl !== uiState.prevImageUrlRef.current) {
          uiState.setIsLoading(true);
          uiState.setHasError(false);
          uiState.prevImageUrlRef.current = imageUrl;
        }
        uiState.setDisplayUrl(imageUrl);
        uiState.setIsLoading(false);
        return;
      }

      // 3. 아무것도 없으면 초기 상태
      uiState.setDisplayUrl(undefined);
      uiState.setIsLoading(false);
      uiState.setHasError(false);
    },
    [uiState, nodeData, updateProperty]
  );

  /**
   * 이미지 로드 성공
   */
  const handleImageLoad = useCallback(() => {
    uiState.setIsLoading(false);
    uiState.setHasError(false);
  }, [uiState]);

  /**
   * 이미지 로드 에러 (자동 재시도 포함)
   */
  const handleImageError = useCallback(async () => {
    uiState.setIsLoading(false);

    // 이미 재시도했거나 재생성 중이면 에러 상태만 표시
    if (uiState.retryCountRef.current > 0 || uiState.isRefreshing) {
      uiState.setHasError(true);
      return;
    }

    // URL 재생성 시도 (한 번만)
    uiState.retryCountRef.current += 1;
    uiState.setIsRefreshing(true);

    try {
      const result = await refreshImageUrlAction(nodeData.blockId);

      if (result.success && result.url) {
        // ✅ 새 URL로 displayUrl 직접 설정 (핵심 수정)
        uiState.setDisplayUrl(result.url);
        uiState.prevImageUrlRef.current = result.url;

        // 블록 속성 업데이트 (캐싱) - 백그라운드
        updateProperty(
          nodeData.blockId,
          'properties.imageUrl',
          result.url,
          nodeData
        ).catch(err => {
          console.error('[ImageBlock] Failed to update imageUrl:', err);
        });

        // 로딩 상태로 돌려서 이미지 재로드 시도
        uiState.setIsLoading(true);
        uiState.setHasError(false);
      } else {
        console.error('Failed to refresh image URL:', result.error);
        uiState.setHasError(true);
      }
    } catch (error) {
      console.error('Error refreshing image URL:', error);
      uiState.setHasError(true);
    } finally {
      uiState.setIsRefreshing(false);
    }
  }, [nodeData, updateProperty, uiState]);

  /**
   * Caption 서버 저장
   */
  const saveCaptionToServer = useCallback(
    async (caption: string) => {
      // 원본 값(서버에 저장된 값)과 비교
      if (caption !== uiState.originalCaptionRef.current) {
        await updateProperty(
          nodeData.blockId,
          'properties.caption',
          caption,
          nodeData
        );
        // 서버 저장 성공 후 원본 값 업데이트
        uiState.originalCaptionRef.current = caption;
      }
    },
    [nodeData, updateProperty, uiState]
  );

  /**
   * 파일 업로드 처리
   */
  const handleFileUpload = useCallback(
    async (addedFiles: FileWithPreview[]) => {
      const fileWithPreview = addedFiles[0];
      if (!fileWithPreview || !(fileWithPreview.file instanceof File)) {
        return;
      }

      try {
        // New image-assets system
        // 1. 이미지 메타데이터 추출 (클라이언트)
        const metadata = await extractImageMetadata(fileWithPreview.file);

        // 2. 파일을 Base64로 변환
        const base64 = await fileToBase64(fileWithPreview.file);

        // 3. Server Action으로 업로드
        const result = await uploadImageAction({
          fileBase64: base64,
          fileName: fileWithPreview.file.name,
          fileSize: fileWithPreview.file.size,
          mimeType: fileWithPreview.file.type,
          workspaceId: nodeData.workspaceId,
          width: metadata.width,
          height: metadata.height,
        });

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        const imageAsset = result.data;

        // 4. ✅ 모든 properties를 한번에 업데이트 (효율적)
        await updateProperties(
          nodeData.blockId,
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
          nodeData
        );
      } catch (error) {
        console.error('Failed to upload image:', error);
        // Fallback to old system
        try {
          const result = await upload({
            bucket: StorageBucket.CANVAS_ASSETS,
            file: fileWithPreview.file,
            orgId: nodeData.orgId,
            workspaceId: nodeData.workspaceId,
            pageId: nodeData.pageId,
            blockId: nodeData.blockId,
          });

          // ✅ 모든 properties를 한번에 업데이트
          await updateProperties(
            nodeData.blockId,
            {
              imageUrl: result.url,
              imageSource: 'user-upload',
              // 기존 메타데이터 제거
              caption: '',
              alt: '',
              unsplashAuthorName: null,
              unsplashAuthorLink: null,
            },
            nodeData
          );
        } catch (fallbackError) {
          console.error('Fallback upload failed:', fallbackError);
          // Last resort: blob URL
          if (fileWithPreview.preview) {
            // ✅ 모든 properties를 한번에 업데이트
            await updateProperties(
              nodeData.blockId,
              {
                imageUrl: fileWithPreview.preview,
                imageSource: 'user-upload',
                // 기존 메타데이터 제거
                caption: '',
                alt: '',
                unsplashAuthorName: null,
                unsplashAuthorLink: null,
              },
              nodeData
            );
          }
        }
      }
    },
    [nodeData, updateProperty, updateProperties, upload]
  );

  return {
    loadImageUrl,
    handleImageLoad,
    handleImageError,
    saveCaptionToServer,
    handleFileUpload,
    isUploading,
  };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 */
export function useMockImageBlockBusiness(): ImageBlockBusinessLogic {
  const loadImageUrl = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  const handleImageLoad = useCallback(() => {
    // Mock implementation
  }, []);

  const handleImageError = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  const saveCaptionToServer = useCallback(async (caption: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  const handleFileUpload = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  return {
    loadImageUrl,
    handleImageLoad,
    handleImageError,
    saveCaptionToServer,
    handleFileUpload,
    isUploading: false,
  };
}
