import { useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { recordImageUsageAction } from '@/domains/image-app-space/actions/image-asset.actions';

import type { ImageItem, SelectImageParams } from './types';

/**
 * Business Logic Interface
 */
export interface ImageSpaceBusinessLogic {
  // 이미지 선택 핸들러
  onSelectImage: (params: SelectImageParams) => Promise<void>;

  // 이미지 검색 (탭별로 다름 - Optional)
  searchImages?: (query: string, category?: string) => Promise<ImageItem[]>;

  // AI 이미지 생성 (Optional)
  generateImage?: (prompt: string) => Promise<string>;
}

/**
 * Production 비즈니스 로직
 *
 * 특징:
 * - API 호출
 * - 데이터 검증
 * - 에러 처리
 * - 도메인 로직
 */
export function useImageSpaceBusiness(
  blockId: string,
  blockData: BlockNodeData
): ImageSpaceBusinessLogic {
  const { getNode, updateNode } = useReactFlow();
  const { updateProperties } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });

  const onSelectImage = useCallback(
    async ({ imageUrl, source, metadata = {} }: SelectImageParams) => {
      try {
        const propertiesToUpdate: Record<string, unknown> = {
          imageUrl,
          imageSource: source,
          ...metadata,
        };

        // Public 이미지 (Unsplash 등)를 선택할 때는 기존 imageAssetId 제거
        // 이전에 private 이미지가 있었더라도, public 이미지로 대체됨
        if (!metadata.imageAssetId) {
          if (source === 'unsplash' || source === 'ai') {
            propertiesToUpdate.imageAssetId = null;
            console.log(
              '[ImageSpace] Clearing imageAssetId for public image source:',
              source
            );
          }
        }

        await updateProperties(
          blockData.blockId,
          propertiesToUpdate,
          blockData
        );

        // Scenario 4: ImageAssetUsage 기록 (use_count 증가)
        if (metadata.imageAssetId && blockData.pageId) {
          try {
            await recordImageUsageAction({
              imageAssetId: metadata.imageAssetId as string,
              blockId,
              pageId: blockData.pageId,
            });
          } catch (error) {
            // Silent fail - usage tracking은 필수가 아님
            console.warn('Failed to record image usage:', error);
          }
        }
      } catch (error) {
        console.error('Failed to select image:', error);
        throw error;
      }
    },
    [blockId, blockData, updateProperties]
  );

  return {
    onSelectImage,
  };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 *
 * 특징:
 * - 실제 API 호출 없음
 * - 콘솔 로그로 동작 확인
 * - Framer에서 테스트용
 */
export function useMockImageSpaceBusiness(): ImageSpaceBusinessLogic {
  const onSelectImage = useCallback(async (params: SelectImageParams) => {
    console.log('[Mock] Selecting image:', params);
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  const searchImages = useCallback(async (query: string, category?: string) => {
    console.log('[Mock] Searching images:', { query, category });
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  }, []);

  const generateImage = useCallback(async (prompt: string) => {
    console.log('[Mock] Generating image:', prompt);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return 'https://via.placeholder.com/800x600';
  }, []);

  return {
    onSelectImage,
    searchImages,
    generateImage,
  };
}
