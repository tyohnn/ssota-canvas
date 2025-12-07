/**
 * Workspace Library Business Logic
 *
 * 워크스페이스의 모든 이미지 조회 및 관리
 */

'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useImageSpaceContext } from '@/domains/image-app-space/frontend/core/image-space.context';
import { getWorkspaceImagesAction } from '@/domains/image-app-space/actions/image-asset.actions';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';

/**
 * Workspace Library Business Logic
 */
export function useWorkspaceLibraryBusiness(
  filterType: 'all' | 'ai-generated' | 'unsplash' | 'user-upload'
) {
  const { onSelectImage: selectImage } = useImageSpaceContext();
  const queryClient = useQueryClient();
  const { selectedWorkspaceId } = useWorkspace();

  // Query for workspace images
  const {
    data: images = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['workspace-images', selectedWorkspaceId, filterType],
    queryFn: async () => {
      if (!selectedWorkspaceId) {
        console.warn('[WorkspaceLibrary] No workspace ID');
        return [];
      }

      const result = await getWorkspaceImagesAction({
        workspaceId: selectedWorkspaceId,
        filterType,
        page: 1,
        perPage: 100,
      });

      if (!result.success) {
        console.error(
          '[WorkspaceLibrary] Failed to load images:',
          result.error
        );
        return [];
      }

      return result.data;
    },
    enabled: !!selectedWorkspaceId,
    staleTime: 24 * 60 * 60 * 1000, // ✅ 24시간 캐싱 (signed URL 만료 시간과 동일)
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24시간 동안 캐시 유지
  });

  // Select Image
  const onSelectImage = useCallback(
    async (image: ImageAsset) => {
      try {
        // ✅ signed_url 우선 사용 (image_url은 storage path)
        const displayUrl = image.signed_url;

        await selectImage({
          imageUrl: displayUrl || '',
          source: 'workspace',
          metadata: {
            imageAssetId: image.id, // ✅ imageAssetId 전달 (signed URL 생성용)
            alt: image.title || undefined,
            caption: image.description || undefined,
          },
        });
      } catch (error) {
        console.error('[WorkspaceLibrary] Select failed:', error);
      }
    },
    [selectImage]
  );

  // Delete Image (soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      // TODO: Implement deleteImageAssetAction
      console.log('[WorkspaceLibrary] Deleting image:', imageId);
      console.warn('[WorkspaceLibrary] Delete not yet implemented');
      // For now, just return success without actually deleting
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-images', selectedWorkspaceId, filterType],
      });
    },
  });

  const deleteImage = useCallback(
    async (imageId: string) => {
      if (!selectedWorkspaceId) {
        console.warn('[WorkspaceLibrary] No workspace ID for delete');
        return;
      }
      // Temporarily disabled - delete not yet implemented
      console.warn('[WorkspaceLibrary] Delete feature temporarily disabled');
      // await deleteMutation.mutateAsync(imageId);
    },
    [selectedWorkspaceId]
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
