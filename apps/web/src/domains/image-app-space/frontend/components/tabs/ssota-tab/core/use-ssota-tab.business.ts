/**
 * Ssota Tab Business Logic
 *
 * 시맨틱 검색 API 연동
 */

'use client';

import { useCallback } from 'react';
import { searchImageAssetsAction } from '@/domains/image-app-space/actions/image-search.actions';
import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';
import { useImageSpaceContext } from '@/domains/image-app-space/frontend/core/image-space.context';

/**
 * Ssota Tab Business Logic
 */
export function useSsotaTabBusiness() {
  const { onSelectImage: selectImage } = useImageSpaceContext();

  const searchImages = useCallback(
    async (query: string): Promise<ImageAsset[]> => {
      if (!query || query.trim().length === 0) {
        return [];
      }

      try {
        // TODO: orgId, workspaceId를 context에서 가져와야 함
        const result = await searchImageAssetsAction({
          orgId: 'temp-org-id', // TODO: context에서 가져오기
          workspaceId: 'temp-workspace-id', // TODO: context에서 가져오기
          query: query.trim(),
          searchType: 'semantic', // 시맨틱 검색만
          topK: 20,
          page: 1,
        });

        if (!result.success) {
          console.error('Failed to search SSOTA images:', result.error);
          return [];
        }

        return result.data.images;
      } catch (error) {
        console.error('[SsotaTabBusiness] Search failed:', error);
        return [];
      }
    },
    []
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
    searchImages,
    onSelectImage,
  };
}
