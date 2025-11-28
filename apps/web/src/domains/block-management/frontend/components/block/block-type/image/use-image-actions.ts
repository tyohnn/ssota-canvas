/**
 * Image Block Actions Hooks
 * Image 블럭의 액션 로직을 훅으로 추출
 */

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { searchImageAssetsAction } from '@/domains/image-app-space/actions/image-search.actions';
import { isFailure } from '@/lib/action-result';
import { toast } from '@workspace/ui/components/ui/sonner';
import { createAndMountBlockAction } from '@/domains/canvas-management/actions/block.actions';
import {
  BlockType,
  getBlockSize,
} from '@/domains/block-management/shared/types/block-types';

/**
 * Image Search Action (통합 검색)
 *
 * SSOTA Image Vault + Unsplash 통합 검색
 * AI Agent가 호출하는 액션
 *
 * 특징: 항상 새 블록 생성
 */
export function useImageImageSearch(blockId: string, blockData: BlockNodeData) {
  const { getNode } = useReactFlow();

  return useCallback(
    async (params: { query: string }) => {
      const { query } = params;

      // 워크스페이스 및 조직 ID 추출
      const node = getNode(blockId);
      if (!node) {
        throw new Error(`Block not found: ${blockId}`);
      }

      const currentBlockData = node.data as BlockNodeData;
      const { workspaceId, orgId, pageId } = currentBlockData;

      if (!workspaceId || !orgId || !pageId) {
        throw new Error('Missing workspaceId, orgId, or pageId');
      }

      try {
        // 1. 이미지 검색
        const result = await searchImageAssetsAction({
          orgId,
          workspaceId,
          query,
          searchType: 'combined',
          topK: 12,
          page: 1,
        });

        if (isFailure(result)) {
          throw new Error(result.error);
        }

        const images = result.data.images;

        if (images.length === 0) {
          toast.info(`No images found for "${query}"`);
          return { success: false, message: 'No images found', images: [] };
        }

        // 2. 첫 번째 이미지로 새 블록 생성
        if (!images[0]) {
          throw new Error('No image found');
        }

        const image = images[0];

        // 자동 위치 계산 (현재 블록 아래에 배치)
        const currentNode = getNode(blockId);
        const position = currentNode?.position
          ? { x: currentNode.position.x, y: currentNode.position.y + 250 }
          : { x: 100, y: 100 };

        // 새 이미지 블록 생성
        const createResult = await createAndMountBlockAction({
          pageId,
          blockType: BlockType.IMAGE,
          position,
          size: getBlockSize(BlockType.IMAGE),
          workspaceId,
          orgId,
          title: image.alt || 'Image',
          initialProperties: {
            imageUrl: image.url,
            imageSource: image.source,
            alt: image.alt,
            ...(image.source === 'unsplash'
              ? {
                  unsplashAuthorName: image.metadata.authorName,
                  unsplashAuthorLink: image.metadata.authorLink,
                  caption: `Photo by ${image.metadata.authorName} on Unsplash`,
                }
              : {
                  ssotaBlockId: image.metadata.blockId,
                  caption: image.alt || '',
                }),
          },
        });

        if (isFailure(createResult)) {
          throw new Error(createResult.error);
        }

        toast.success(`Created new image block from ${image.source}`);

        return {
          success: true,
          message: `Created new block with image from ${image.source}`,
          images,
          block: {
            blockId: createResult.data.blockId,
            blockMountId: createResult.data.blockMountId,
            blockType: createResult.data.blockType,
            title: createResult.data.title,
            properties: createResult.data.properties,
            content: createResult.data.content,
          },
        };
      } catch (error) {
        console.error('[useImageImageSearch] Error:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to search images'
        );
        throw error;
      }
    },
    [blockId, blockData, getNode]
  );
}

/**
 * Unsplash 이미지 검색 (deprecated)
 *
 * @deprecated Use useImageImageSearch instead
 */
export function useImageUnsplashSearch(
  blockId: string,
  blockData: BlockNodeData
) {
  const imageSearch = useImageImageSearch(blockId, blockData);

  return useCallback(
    async (params: { query: string }) => {
      return await imageSearch({
        query: params.query,
      });
    },
    [imageSearch]
  );
}

/**
 * AI 이미지 생성
 */
export function useImageGenerate(blockId: string, blockData: BlockNodeData) {
  return useCallback(() => {
    console.log('[TODO] AI 이미지 생성:', { blockId });
    // TODO: AI 이미지 생성 로직 구현
    // 1. DALL-E / Stable Diffusion API 호출
    // 2. 생성된 이미지를 블록에 적용
  }, [blockId, blockData]);
}

/**
 * 이미지 스타일 검색
 */
export function useImageSearchStyle(blockId: string, blockData: BlockNodeData) {
  return useCallback(() => {
    console.log('[TODO] 이미지 스타일 검색:', { blockId });
    // TODO: 이미지 스타일 검색 로직 구현
    // 1. 이미지 분석
    // 2. 유사한 스타일의 이미지 찾기
  }, [blockId, blockData]);
}
