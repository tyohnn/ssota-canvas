/**
 * Image Search UI State Hook
 *
 * UI 상태만 관리 (비즈니스 로직 없음)
 * 노코드 환경에서 독립적으로 테스트 가능
 */

import { useState, useCallback, useRef } from 'react';
import type { ImageSearchUIState, ApplyMode } from './types';
import type {
  ImageAsset,
  SearchType,
} from '@/domains/image-app-space/shared/types/image-search.types';

/**
 * UI State Hook
 *
 * 특징:
 * - 비즈니스 로직 없음
 * - 로컬 상태만 관리
 * - API 호출 없음
 */
export function useImageSearchUI(
  initialBlockIds: string[]
): ImageSearchUIState {
  // Popover 상태
  const [open, setOpen] = useState(false);

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('combined');

  // 선택 상태
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] =
    useState<string[]>(initialBlockIds);

  // 적용 모드
  const [applyMode, setApplyMode] = useState<ApplyMode>('replace');

  // Ref
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Popover 열림/닫힘 핸들러
   */
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      // 닫힐 때 모든 상태 초기화
      if (!nextOpen) {
        setSearchQuery('');
        setSelectedImage(null);
        setSearchType('combined');
        setSelectedBlockIds(initialBlockIds);
        setApplyMode('replace');
      }

      // 열릴 때 검색창 포커스
      if (nextOpen) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    },
    [initialBlockIds]
  );

  /**
   * 이미지 선택 핸들러
   */
  const selectImage = useCallback((image: ImageAsset | null) => {
    setSelectedImage(image);
  }, []);

  /**
   * 블록 ID 토글 핸들러
   */
  const toggleBlockId = useCallback((blockId: string) => {
    setSelectedBlockIds(prev => {
      if (prev.includes(blockId)) {
        // 이미 선택된 경우 제거 (최소 1개는 유지)
        return prev.length > 1 ? prev.filter(id => id !== blockId) : prev;
      } else {
        // 선택되지 않은 경우 추가
        return [...prev, blockId];
      }
    });
  }, []);

  /**
   * 상태 초기화
   */
  const resetState = useCallback(() => {
    setSearchQuery('');
    setSelectedImage(null);
    setSearchType('combined');
    setSelectedBlockIds(initialBlockIds);
    setApplyMode('replace');
  }, [initialBlockIds]);

  return {
    // Popover
    open,
    setOpen,

    // 검색
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,

    // 선택
    selectedImage,
    selectImage,
    selectedBlockIds,
    toggleBlockId,
    setSelectedBlockIds,

    // 적용 모드
    applyMode,
    setApplyMode,

    // Ref
    searchInputRef,

    // 헬퍼
    handleOpenChange,
    resetState,
  };
}
