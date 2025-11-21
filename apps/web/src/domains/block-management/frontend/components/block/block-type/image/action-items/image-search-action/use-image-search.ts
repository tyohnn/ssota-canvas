/**
 * Image Search Hook (통합)
 *
 * UI State + Business Logic 통합
 * Optional Injection 지원
 */

import { useCallback } from 'react';
import type { ImageSearchUIState, ImageSearchBusinessLogic } from './types';
import { useImageSearchUI } from './use-image-search.ui';
import { useImageSearchBusiness } from './use-image-search.business';

/**
 * 통합 Hook 결과
 */
export interface UseImageSearchResult
  extends ImageSearchUIState,
    ImageSearchBusinessLogic {
  // 통합 액션
  handleSearch: () => Promise<void>;
  handleApply: () => Promise<void>;
}

/**
 * Image Search Hook (통합)
 *
 * @param initialBlockIds - 초기 블록 ID 목록
 * @param orgId - 조직 ID
 * @param workspaceId - 워크스페이스 ID
 * @param businessLogic - 비즈니스 로직 (선택적, 테스트/Mock용)
 */
export function useImageSearch(
  initialBlockIds: string[],
  orgId: string,
  workspaceId: string,
  businessLogic?: ImageSearchBusinessLogic
): UseImageSearchResult {
  // UI State
  const uiState = useImageSearchUI(initialBlockIds);

  // Business Logic (Optional Injection)
  const defaultBusiness = useImageSearchBusiness(orgId, workspaceId);
  const business = businessLogic ?? defaultBusiness;

  // handleOpenChange를 clearResults와 연결
  const handleOpenChangeWithClear = useCallback(
    (nextOpen: boolean) => {
      uiState.handleOpenChange(nextOpen);
      // 닫힐 때 검색 결과도 초기화
      if (!nextOpen) {
        business.clearResults();
      }
    },
    [uiState, business]
  );

  /**
   * 검색 실행 핸들러
   */
  const handleSearch = useCallback(async () => {
    if (!uiState.searchQuery.trim()) {
      return;
    }

    await business.search({
      query: uiState.searchQuery,
      searchType: uiState.searchType,
    });
  }, [uiState.searchQuery, uiState.searchType, business]);

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

    // 성공 시 Popover 닫기 (handleOpenChange를 통해 모든 상태 초기화)
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
    handleSearch,
    handleApply,
  };
}
