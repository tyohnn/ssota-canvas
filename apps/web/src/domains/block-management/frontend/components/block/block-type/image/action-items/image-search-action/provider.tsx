/**
 * Image Search Action Provider
 *
 * Context Provider + Radix Dialog 래퍼
 */

'use client';

import React from 'react';

import { Dialog } from '@workspace/ui/components/coss-ui/dialog';

import { ImageSearchActionContext } from './image-search-action.context';
import { useImageSearch } from './use-image-search';

/**
 * Provider Props
 */
export interface ImageSearchActionProviderProps {
  /** 초기 블록 ID 목록 */
  blockIds: string[];

  /** 자식 컴포넌트 */
  children: React.ReactNode;
}

/**
 * Image Search Action Provider
 *
 * Context + Radix Popover 통합
 */
export function ImageSearchActionProvider({
  blockIds,
  children,
}: ImageSearchActionProviderProps): React.ReactElement {
  // 통합 Hook
  const imageSearch = useImageSearch({ initialBlockIds: blockIds });

  return (
    <ImageSearchActionContext.Provider value={imageSearch}>
      <Dialog
        open={imageSearch.open}
        onOpenChange={imageSearch.handleOpenChange}
      >
        {children}
      </Dialog>
    </ImageSearchActionContext.Provider>
  );
}
