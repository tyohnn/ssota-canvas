/**
 * Workspace Library Business Logic
 *
 * 내 이미지 조회 및 관리
 */

'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useImageSpaceContext } from '@/domains/image-app-space/frontend/core/image-space.context';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';
// TODO: 실제 API actions 추가 필요

/**
 * Workspace Library Business Logic
 */
export function useWorkspaceLibraryBusiness(
  filterType: 'all' | 'ai-generated' | 'unsplash' | 'user-upload'
) {
  const { onSelectImage: selectImage } = useImageSpaceContext();
  const queryClient = useQueryClient();

  // Query for workspace images
  const {
    data: images = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['workspace-images', filterType],
    queryFn: async () => {
      // TODO: 실제 API 호출
      // const result = await getWorkspaceImagesAction({ filterType });
      console.log('[WorkspaceLibrary] Loading images:', filterType);

      // Mock data for now
      return [] as ImageAsset[];
    },
  });

  // Select Image
  const onSelectImage = useCallback(
    async (image: ImageAsset) => {
      try {
        await selectImage({
          imageUrl: image.image_url,
          source: 'ssota',
          metadata: {},
        });
      } catch (error) {
        console.error('[WorkspaceLibrary] Select failed:', error);
      }
    },
    [selectImage]
  );

  // Delete Image
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      // TODO: 실제 API 호출
      // const result = await deleteImageAssetAction({ imageAssetId: imageId });
      console.log('[WorkspaceLibrary] Deleting image:', imageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-images'] });
    },
  });

  const deleteImage = useCallback(
    async (imageId: string) => {
      await deleteMutation.mutateAsync(imageId);
    },
    [deleteMutation]
  );

  const refreshImages = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    images,
    isLoading,
    refreshImages,
    onSelectImage,
    deleteImage,
  };
}
