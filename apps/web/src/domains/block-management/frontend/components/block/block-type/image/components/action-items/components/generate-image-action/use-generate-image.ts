/**
 * Generate Image Hook (통합)
 *
 * UI State + Business Logic 통합
 * Optional Injection 지원
 */
import { useCallback } from 'react';

import { CanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';

import type { GenerateImageBusinessLogic, GenerateImageUIState } from './types';
import { useGenerateImageBusiness } from './use-generate-image.business';
import { useGenerateImageUI } from './use-generate-image.ui';

/**
 * 통합 Hook 결과
 */
export interface UseGenerateImageResult
  extends GenerateImageUIState, GenerateImageBusinessLogic {
  // 통합 액션
  handleGenerate: () => Promise<void>;
  handleApply: () => Promise<void>;
}

/**
 * Generate Image Hook (통합)
 *
 * @param initialBlockIds - 초기 블록 ID 목록
 * @param canvasMetadataOverride - 캔버스 메타데이터 오버라이드 (선택적, 테스트/Mock용)
 * @param businessLogic - 비즈니스 로직 (선택적, 테스트/Mock용)
 */
export function useGenerateImage({
  initialBlockIds,
  canvasMetadataOverride,
  businessLogic,
}: {
  initialBlockIds: string[];
  // Optional injection
  canvasMetadataOverride?: CanvasMetadata;
  businessLogic?: GenerateImageBusinessLogic;
}): UseGenerateImageResult {
  const canvasMetadata = useCanvasMetadata(canvasMetadataOverride);
  const { workspaceId, orgId } = canvasMetadata;

  // UI State
  const uiState = useGenerateImageUI(initialBlockIds);

  // Business Logic (Optional Injection)
  const defaultBusiness = useGenerateImageBusiness(
    orgId,
    workspaceId,
    initialBlockIds
  );
  const business = businessLogic ?? defaultBusiness;

  // handleOpenChange를 clearResults와 연결
  const handleOpenChangeWithClear = useCallback(
    (nextOpen: boolean) => {
      uiState.handleOpenChange(nextOpen);
      // 닫힐 때 생성 결과도 초기화
      if (!nextOpen) {
        business.clearResults();
      }
    },
    [uiState, business]
  );

  /**
   * 이미지 생성 실행 핸들러
   */
  const handleGenerate = useCallback(async () => {
    if (!uiState.prompt.trim()) {
      return;
    }

    await business.generateImages({
      prompt: uiState.prompt,
      negativePrompt: uiState.negativePrompt || undefined,
      modelId: uiState.modelId,
      outputCount: uiState.outputCount,
      size: uiState.size,
      aspectRatio: uiState.aspectRatio,
      seed: uiState.seedEnabled ? uiState.seedValue : undefined,
    });
  }, [
    uiState.prompt,
    uiState.negativePrompt,
    uiState.modelId,
    uiState.outputCount,
    uiState.size,
    uiState.aspectRatio,
    uiState.seedEnabled,
    uiState.seedValue,
    business,
  ]);

  /**
   * 이미지 적용 핸들러
   */
  const handleApply = useCallback(async () => {
    if (!uiState.selectedImage) {
      return;
    }

    await business.applyImage(
      uiState.selectedImage,
      uiState.selectedBlockIds,
      uiState.applyMode
    );

    // 성공 시 Dialog 닫기 (handleOpenChange를 통해 모든 상태 초기화)
    handleOpenChangeWithClear(false);
  }, [
    uiState.selectedImage,
    uiState.selectedBlockIds,
    uiState.applyMode,
    handleOpenChangeWithClear,
    business,
  ]);

  return {
    // UI State
    ...uiState,
    handleOpenChange: handleOpenChangeWithClear, // Override with clear logic

    // Business Logic
    ...business,

    // 통합 액션
    handleGenerate,
    handleApply,
  };
}
