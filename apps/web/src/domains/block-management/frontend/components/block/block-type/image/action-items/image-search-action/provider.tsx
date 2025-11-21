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
import type { ImageSearchBusinessLogic } from './types';

/**
 * Provider Props
 */
export interface ImageSearchActionProviderProps {
  /** 초기 블록 ID 목록 */
  blockIds: string[];

  /** 조직 ID */
  orgId: string;

  /** 워크스페이스 ID */
  workspaceId: string;

  /** 비즈니스 로직 (선택적, 테스트/Mock용) */
  businessLogic?: ImageSearchBusinessLogic;

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
  orgId,
  workspaceId,
  businessLogic,
  children,
}: ImageSearchActionProviderProps): React.ReactElement {
  // 통합 Hook
  const imageSearch = useImageSearch(
    blockIds,
    orgId,
    workspaceId,
    businessLogic
  );

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
