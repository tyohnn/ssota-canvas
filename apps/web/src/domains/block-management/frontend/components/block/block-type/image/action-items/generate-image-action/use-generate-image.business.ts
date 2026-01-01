/**
 * Generate Image Business Logic Hook
 *
 * 비즈니스 로직만 처리 (UI 상태 없음)
 * - Server Action 호출
 * - 이미지 적용 로직
 * - 에러 처리
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { GenerateImageBusinessLogic, ApplyMode } from './types';
import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';
import { generateImageAssetsAction } from '@/domains/image-app-space/actions/image-generation.actions';
import { useBlockPropertyUpdate } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import { isFailure } from '@/lib';
import { toast } from '@workspace/ui/components/ui/sonner';
import { useReactFlow } from '@xyflow/react';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  IMAGE_GENERATION_MODELS,
  type ImageGenerationModel,
} from '@/domains/image-app-space/shared/config/image-generation-models';

/**
 * Business Logic Hook (Production)
 *
 * @param orgId - 조직 ID
 * @param workspaceId - 워크스페이스 ID
 * @param blockIds - 블록 ID 목록 (첫 번째 블록의 pageId 추출용)
 */
export function useGenerateImageBusiness(
  orgId: string,
  workspaceId: string,
  blockIds: string[]
): GenerateImageBusinessLogic {
  const [results, setResults] = useState<ImageAsset[]>([]);
  const { updateProperties } = useBlockPropertyUpdate();
  const { getNode } = useReactFlow();

  // 이미지 생성 Mutation (React Query)
  const generateMutation = useMutation({
    mutationFn: async (params: {
      prompt: string;
      negativePrompt?: string;
      modelId: string;
      outputCount: number;
      size?: string;
      aspectRatio?: string;
      seed?: number;
    }) => {
      // 첫 번째 블록에서 pageId 추출
      const firstBlockId = blockIds[0];
      if (!firstBlockId) {
        throw new Error('No block ID provided');
      }

      const node = getNode(firstBlockId);
      if (!node) {
        throw new Error(`Block not found: ${firstBlockId}`);
      }

      const blockData = node.data as BlockNodeData;
      const pageId = blockData.pageId;
      if (!pageId) {
        throw new Error('Page ID not found in block data');
      }

      const result = await generateImageAssetsAction(
        {
          orgId,
          workspaceId,
          prompt: params.prompt,
          negativePrompt: params.negativePrompt,
          modelId: params.modelId,
          outputCount: params.outputCount,
          size: params.size,
          aspectRatio: params.aspectRatio,
          seed: params.seed,
        },
        pageId,
        firstBlockId
      );

      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: data => {
      setResults(data.images);

      if (data.images.length === 0) {
        toast.info('No images generated. Try adjusting your prompt.');
      } else {
        toast.success(`Generated ${data.images.length} image(s)`);
      }
    },
    onError: error => {
      console.error('[GenerateImageBusiness] Generation failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate images'
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
              console.warn(
                `[GenerateImageBusiness] Block not found: ${blockId}`
              );
              return;
            }

            const blockData = node.data as BlockNodeData;

            await updateProperties(
              blockId,
              {
                imageUrl: image.url,
                imageAssetId: image.id,
                imageSource: 'ai-generated',
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
          '[GenerateImageBusiness] Create new block not yet implemented'
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
      console.error('[GenerateImageBusiness] Apply failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to apply image'
      );
    },
  });

  // 이미지 생성 실행
  const generateImages = useCallback(
    async (params: {
      prompt: string;
      negativePrompt?: string;
      modelId: string;
      outputCount: number;
      size?: string;
      aspectRatio?: string;
      seed?: number;
    }) => {
      await generateMutation.mutateAsync(params);
    },
    [generateMutation]
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
    generateImages,
    applyImage,
    clearResults,
    results,
    isGenerating: generateMutation.isPending,
    isApplying: applyMutation.isPending,
    error: generateMutation.error || applyMutation.error,
    availableModels: IMAGE_GENERATION_MODELS,
  };
}

/**
 * Mock Business Logic Hook (노코드 툴용)
 */
export function useMockGenerateImageBusiness(): GenerateImageBusinessLogic {
  const [results, setResults] = useState<ImageAsset[]>([]);

  const generateImages = useCallback(
    async (params: {
      prompt: string;
      negativePrompt?: string;
      modelId: string;
      outputCount: number;
      size?: string;
      aspectRatio?: string;
      seed?: number;
    }) => {
      console.log('[Mock] Generating images:', params);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock 결과 생성
      const mockImages: ImageAsset[] = Array.from({
        length: params.outputCount,
      }).map((_, i) => ({
        id: `mock-${Date.now()}-${i}`,
        url: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(params.prompt.slice(0, 20))}`,
        thumbnailUrl: `https://via.placeholder.com/300x300?text=${encodeURIComponent(params.prompt.slice(0, 20))}`,
        alt: params.prompt,
        source: 'ssota',
        metadata: {
          blockId: `mock-block-${i}`,
        },
      }));

      setResults(mockImages);
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
    generateImages,
    applyImage,
    clearResults,
    results,
    isGenerating: false,
    isApplying: false,
    error: null,
    availableModels: IMAGE_GENERATION_MODELS,
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

  // SSOTA 이미지 또는 생성된 이미지
  return {
    ssotaBlockId: image.metadata.blockId,
    caption: image.alt || '',
  };
}
