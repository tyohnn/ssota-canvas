import { useCallback } from 'react';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useImageSpaceUI } from './use-image-space.ui';
import {
  useImageSpaceBusiness,
  type ImageSpaceBusinessLogic,
} from './use-image-space.business';
import type { SelectImageParams } from './types';

/**
 * Combined Hook (UI + Business 통합)
 *
 * 특징:
 * - UI State + Business Logic 통합
 * - Optional injection 지원
 * - Production: 기본 비즈니스 로직 사용
 * - Test/Mock: 커스텀 로직 주입 가능
 */
export function useImageSpace(
  blockId: string,
  blockData: BlockNodeData,
  businessLogic?: ImageSpaceBusinessLogic // 🎯 Optional injection
) {
  // UI State (디자이너 영역)
  const uiState = useImageSpaceUI();

  // Business Logic (엔지니어 영역)
  const defaultBusiness = useImageSpaceBusiness(blockId, blockData);
  const business = businessLogic ?? defaultBusiness;

  // Combined Logic: 이미지 선택 후 Dialog 닫기
  const handleSelectImage = useCallback(
    async (params: SelectImageParams) => {
      try {
        // ✅ Business 로직 먼저 실행 (비동기 작업 완료 후 UI 업데이트)
        await business.onSelectImage(params);

        // ✅ 성공 후 Dialog 닫기 (handleOpenChange에서 상태 초기화도 함께 처리됨)
        uiState.setOpen(false);
      } catch (error) {
        console.error('Failed to select image in Image Space:', error);
        // UI: 에러 시 Dialog는 유지 (사용자가 재시도 가능)
        throw error;
      }
    },
    [uiState, business]
  );

  return {
    blockId,
    blockData,
    ...uiState,
    onSelectImage: handleSelectImage,
    businessLogic: business,
  };
}
