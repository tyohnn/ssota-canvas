/**
 * Image Search Action Types
 */

import type {
  ImageAsset,
  SearchType,
} from '@/domains/image-app-space/shared/types/image-search.types';

/**
 * Apply Mode
 */
export type ApplyMode = 'replace' | 'createNew';

/**
 * Image Search Action Props
 */
export interface ImageSearchActionProps {
  /** 초기 블록 ID 목록 */
  blockIds: string[];
}

/**
 * UI State
 */
export interface ImageSearchUIState {
  // Popover 상태
  open: boolean;
  setOpen: (open: boolean) => void;

  // 검색어
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // 검색 타입
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;

  // 선택된 이미지
  selectedImage: ImageAsset | null;
  selectImage: (image: ImageAsset | null) => void;

  // 선택된 블록 ID 목록
  selectedBlockIds: string[];
  toggleBlockId: (blockId: string) => void;
  setSelectedBlockIds: (blockIds: string[]) => void;

  // 적용 모드
  applyMode: ApplyMode;
  setApplyMode: (mode: ApplyMode) => void;

  // Ref
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // 헬퍼
  handleOpenChange: (open: boolean) => void;
  resetState: () => void;
}

/**
 * Business Logic
 */
export interface ImageSearchBusinessLogic {
  // 검색
  search: (params: { query: string; searchType: SearchType }) => Promise<void>;

  // 이미지 적용
  applyImage: (
    image: ImageAsset,
    blockIds: string[],
    mode: ApplyMode
  ) => Promise<void>;

  // 결과 초기화
  clearResults: () => void;

  // 상태
  results: ImageAsset[];
  isSearching: boolean;
  isApplying: boolean;
  error: Error | null;
}
