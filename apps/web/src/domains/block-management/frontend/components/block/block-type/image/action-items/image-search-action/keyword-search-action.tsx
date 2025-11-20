/**
 * Image Keyword Search Action
 *
 * Keyword 검색 전용 래퍼 (Unsplash + SSOTA Keyword)
 */

'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { ImageSearchAction, type ImageSearchActionFullProps } from './index';

/**
 * Keyword Search Action Props
 */
export interface ImageKeywordSearchActionProps {
  blockIds: string[];
  orgId: string;
  workspaceId: string;
}

/**
 * Image Keyword Search Action
 *
 * Keyword 검색에 최적화된 래퍼 컴포넌트
 */
export function ImageKeywordSearchAction({
  blockIds,
  orgId,
  workspaceId,
}: ImageKeywordSearchActionProps): React.ReactElement {
  return (
    <ImageSearchAction
      blockIds={blockIds}
      orgId={orgId}
      workspaceId={workspaceId}
      defaultSearchType="keyword"
      triggerIcon={Search}
      triggerTooltip="Keyword Search"
    />
  );
}
