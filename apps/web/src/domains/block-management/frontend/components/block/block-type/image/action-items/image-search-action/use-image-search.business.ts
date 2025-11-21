/**
 * Image Search Business Logic Hook
 *
 * 비즈니스 로직만 처리 (UI 상태 없음)
 * - Server Action 호출
 * - 이미지 적용 로직
 * - 에러 처리
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ImageSearchBusinessLogic, ApplyMode } from './types';
import type {
  ImageAsset,
  SearchType,
} from '@/domains/image-app-space/shared/types/image-search.types';
import { searchImageAssetsAction } from '@/domains/image-app-space/actions/image-search.actions';
import { useBlockPropertyUpdate } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import { isFailure } from '@/lib/action-result';
import { toast } from '@workspace/ui/components/ui/sonner';
import { useReactFlow } from '@xyflow/react';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * Business Logic Hook (Production)
 *
 * @param orgId - 조직 ID
 * @param workspaceId - 워크스페이스 ID
 */
export function useImageSearchBusiness(
  orgId: string,
  workspaceId: string
): ImageSearchBusinessLogic {
  const [results, setResults] = useState<ImageAsset[]>([]);
  const { updateProperties } = useBlockPropertyUpdate();
  const { getNode } = useReactFlow();

  // 검색 Mutation (React Query)
  const searchMutation = useMutation({
    mutationFn: async (params: { query: string; searchType: SearchType }) => {
      const result = await searchImageAssetsAction({
        orgId,
        workspaceId,
        query: params.query,
        searchType: params.searchType,
        topK: 12,
        page: 1,
      });

      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: data => {
      setResults(data.images);

      if (data.images.length === 0) {
        toast.info('No images found. Try a different search term.');
      }
    },
    onError: error => {
      console.error('[ImageSearchBusiness] Search failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to search images'
      );
      setResults([]);
    },
  });

  // 이미지 적용 Mutation
  const applyMutation = useMutation({
    mutationFn: async ({
      image,
      blockIds,
      mode,
    }: {
      image: ImageAsset;
      blockIds: string[];
      mode: ApplyMode;
    }) => {
      if (mode === 'replace') {
        // 기존 블록 업데이트 (병렬 처리)
        await Promise.all(
          blockIds.map(async blockId => {
            const node = getNode(blockId);
            if (!node) {
              console.warn(`[ImageSearchBusiness] Block not found: ${blockId}`);
              return;
            }

            const blockData = node.data as BlockNodeData;

            await updateProperties(
              blockId,
              {
                imageUrl: image.url,
                imageSource: image.source,
                alt: image.alt,
                ...buildMetadata(image),
              },
              blockData
            );
          })
        );
      } else if (mode === 'createNew') {
        // 새 블록 생성 (TODO: useCanvasBlockLifecycle 연동 필요)
        console.warn(
          '[ImageSearchBusiness] Create new block not yet implemented'
        );
        toast.info('Create new block feature is coming soon!');
      }
    },
    onSuccess: (_, variables) => {
      const { blockIds, mode } = variables;

      if (mode === 'replace') {
        toast.success(
          `Image applied to ${blockIds.length} block${blockIds.length > 1 ? 's' : ''}`
        );
      }
    },
    onError: error => {
      console.error('[ImageSearchBusiness] Apply failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to apply image'
      );
    },
  });

  // 검색 실행
  const search = useCallback(
    async (params: { query: string; searchType: SearchType }) => {
      await searchMutation.mutateAsync(params);
    },
    [searchMutation]
  );

  // 이미지 적용
  const applyImage = useCallback(
    async (image: ImageAsset, blockIds: string[], mode: ApplyMode) => {
      await applyMutation.mutateAsync({ image, blockIds, mode });
    },
    [applyMutation]
  );

  // 결과 초기화
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    search,
    applyImage,
    clearResults,
    results,
    isSearching: searchMutation.isPending,
    isApplying: applyMutation.isPending,
    error: searchMutation.error || applyMutation.error,
  };
}

/**
 * Mock Business Logic Hook (노코드 툴용)
 */
export function useMockImageSearchBusiness(): ImageSearchBusinessLogic {
  const [results, setResults] = useState<ImageAsset[]>([]);

  const search = useCallback(
    async (params: { query: string; searchType: SearchType }) => {
      console.log('[Mock] Searching images:', params);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResults([]);
    },
    []
  );

  const applyImage = useCallback(
    async (image: ImageAsset, blockIds: string[], mode: ApplyMode) => {
      console.log('[Mock] Applying image:', { image, blockIds, mode });
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    []
  );

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    search,
    applyImage,
    clearResults,
    results,
    isSearching: false,
    isApplying: false,
    error: null,
  };
}

/**
 * Helper: 이미지 메타데이터 빌드
 */
function buildMetadata(image: ImageAsset): Record<string, unknown> {
  if (image.source === 'unsplash') {
    return {
      unsplashAuthorName: image.metadata.authorName,
      unsplashAuthorLink: image.metadata.authorLink,
      caption: `Photo by ${image.metadata.authorName} on Unsplash`,
    };
  }

  // SSOTA 이미지
  return {
    ssotaBlockId: image.metadata.blockId,
    caption: image.alt || '',
  };
}
