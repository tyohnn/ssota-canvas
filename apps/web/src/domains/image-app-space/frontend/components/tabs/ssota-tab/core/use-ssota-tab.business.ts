/**
 * Ssota Tab Business Logic
 *
 * 공개 이미지 탐색 (시맨틱 검색 포함)
 */

'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { browseCommunityFeedAction } from '@/domains/image-app-space/actions/image-asset.actions';
import { searchImageAssetsAction } from '@/domains/image-app-space/actions/image-search.actions';
import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';
import { useImageSpaceContext } from '@/domains/image-app-space/frontend/core/image-space.context';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';

/**
 * Ssota Tab Business Logic
 */
export function useSsotaTabBusiness() {
  const { onSelectImage: selectImage } = useImageSpaceContext();
  const { selectedWorkspaceId, organizationId } = useWorkspace();

  // 공개 이미지 목록 (초기 표시)
  const { data: publicImages = [], isLoading } = useQuery({
    queryKey: ['ssota-public-images'],
    queryFn: async () => {
      const result = await browseCommunityFeedAction({
        sort: 'recent',
        page: 1,
        perPage: 50,
      });

      if (!result.success) {
        console.error('[SsotaTab] Failed to load public images:', result.error);
        return [];
      }

      return result.data;
    },
  });

  // 시맨틱 검색
  const searchImages = useCallback(
    async (query: string): Promise<ImageAsset[]> => {
      if (!query || query.trim().length === 0) {
        return [];
      }

      if (!organizationId || !selectedWorkspaceId) {
        console.warn('[SsotaTab] Missing org or workspace ID');
        return [];
      }

      try {
        const result = await searchImageAssetsAction({
          orgId: organizationId,
          workspaceId: selectedWorkspaceId,
          query: query.trim(),
          searchType: 'semantic',
          topK: 20,
          page: 1,
        });

        if (!result.success) {
          console.error('[SsotaTab] Search failed:', result.error);
          return [];
        }

        return result.data.images;
      } catch (error) {
        console.error('[SsotaTab] Search error:', error);
        return [];
      }
    },
    [organizationId, selectedWorkspaceId]
  );

  const onSelectImage = useCallback(
    async (image: ImageAsset) => {
      try {
        await selectImage({
          imageUrl: image.url,
          source: 'ssota',
          metadata: {},
        });
      } catch (error) {
        console.error('[SsotaTabBusiness] Select failed:', error);
      }
    },
    [selectImage]
  );

  return {
    publicImages,
    isLoading,
    searchImages,
    onSelectImage,
  };
}
