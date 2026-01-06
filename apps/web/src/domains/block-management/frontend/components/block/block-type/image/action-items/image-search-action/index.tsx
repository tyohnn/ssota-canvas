/**
 * Image Search Action Component
 *
 * SSOTA Image Vault + Unsplash 통합 검색 액션
 *
 * Compound Component Pattern 적용
 * - Provider + 서브 컴포넌트 조합
 * - Context를 통한 상태 공유
 * - 노코드 친화적 Props 설계
 */

'use client';

import React from 'react';

import { LucideIcon, Search } from 'lucide-react';

import { Box } from '@workspace/ui/components/ui/box';

import type { SearchType } from '@/domains/image-app-space/shared/types/image-search.types';

import { PopoverContent } from './components/popover-content';
import { ResultGrid } from './components/result-grid';
import { SearchBar } from './components/search-bar';
import { SelectionPanel } from './components/selection-panel';
import { Trigger } from './components/trigger';
import { ImageSearchActionProvider } from './provider';
import type { ImageSearchActionProps } from './types';

/**
 * 범용 Image Search Action Props
 */
export interface ImageSearchActionFullProps extends ImageSearchActionProps {
  /** 기본 검색 타입 */
  defaultSearchType?: SearchType;

  /** 트리거 아이콘 */
  triggerIcon?: LucideIcon;

  /** 트리거 툴팁 */
  triggerTooltip?: string;
}

/**
 * Image Search Action (범용 컴포넌트)
 *
 * Provider + Trigger + Popover Content 조합
 *
 * @example
 * ```tsx
 * <ImageSearchAction
 *   blockIds={[blockId]}
 *   orgId={orgId}
 *   workspaceId={workspaceId}
 *   defaultSearchType="keyword"
 *   triggerIcon={Search}
 *   triggerTooltip="Search images (keyword)"
 * />
 * ```
 */
export function ImageSearchAction({
  blockIds,
  defaultSearchType = 'combined',
  triggerIcon = Search,
  triggerTooltip = 'Search images',
}: ImageSearchActionFullProps): React.ReactElement {
  return (
    <ImageSearchActionProvider blockIds={blockIds}>
      {/* Trigger */}
      <Trigger
        defaultSearchType={defaultSearchType}
        icon={triggerIcon}
        tooltip={triggerTooltip}
      />

      {/* Dialog Content */}
      <PopoverContent>
        {/* 전체 레이아웃 */}
        <Box className="flex flex-col h-full min-h-0">
          {/* Search Bar */}
          <SearchBar />

          {/* Result Grid */}
          <ResultGrid />

          {/* Selection Panel */}
          <SelectionPanel />
        </Box>
      </PopoverContent>
    </ImageSearchActionProvider>
  );
}

// 개별 컴포넌트 export (커스터마이징용)
export { ImageSearchActionProvider } from './provider';
export { Trigger as ImageSearchTrigger } from './components/trigger';
export { PopoverContent as ImageSearchPopoverContent } from './components/popover-content';
export { SearchBar as ImageSearchSearchBar } from './components/search-bar';
export { ResultGrid as ImageSearchResultGrid } from './components/result-grid';
export { SelectionPanel as ImageSearchSelectionPanel } from './components/selection-panel';

// Hooks export
export { useImageSearch } from './use-image-search';
export { useImageSearchUI } from './use-image-search.ui';
export {
  useImageSearchBusiness,
  useMockImageSearchBusiness,
} from './use-image-search.business';
export { useImageSearchActionContext } from './image-search-action.context';

// Types export
export type { ImageSearchActionProps } from './types';
