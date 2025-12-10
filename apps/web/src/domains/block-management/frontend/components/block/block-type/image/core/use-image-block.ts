/**
 * ImageBlock Combined Hook
 *
 * UI State + Business Logic 통합
 * Optional injection 지원
 */

import { useEffect } from 'react';
import { useImageBlockUI } from './use-image-block.ui';
import { useImageBlockBusiness } from './use-image-block.business';
import type { ImageBlockBusinessLogic, ImageBlockUIState } from './types';
import type { ImageBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { ImageBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

export interface UseImageBlockResult
  extends ImageBlockUIState,
    ImageBlockBusinessLogic {
  // Combined logic
}

/**
 * Combined Hook
 *
 * Production: 기본 비즈니스 로직 사용
 * Test/Mock: 커스텀 로직 주입 가능
 */
export function useImageBlock(
  nodeData: ImageBlockNodeData,
  properties: ImageBlockProperties,
  businessLogic?: ImageBlockBusinessLogic // 🎯 Optional injection
): UseImageBlockResult {
  const { imageUrl, imageAssetId, imageSource, caption } = properties;

  // UI State (디자이너 영역)
  const uiState = useImageBlockUI(imageUrl, caption);

  // Business Logic (엔지니어 영역)
  const defaultBusiness = useImageBlockBusiness(nodeData, uiState);
  const business = businessLogic ?? defaultBusiness;

  // 이미지 URL 처리 (imageSource 기반 우선순위)
  useEffect(() => {
    // ✅ business를 의존성에서 제거하여 무한 루프 방지
    business.loadImageUrl(imageAssetId, imageUrl, imageSource);
  }, [imageAssetId, imageUrl, imageSource]);

  // 외부 데이터가 바뀌었을 때, 편집 중이 아니면 초안 동기화
  useEffect(() => {
    if (!uiState.isEditingCaption) {
      uiState.setDraftCaption(caption || '');
      uiState.originalCaptionRef.current = caption || '';
    }
  }, [caption, uiState]);

  return {
    ...uiState,
    ...business,
  };
}
