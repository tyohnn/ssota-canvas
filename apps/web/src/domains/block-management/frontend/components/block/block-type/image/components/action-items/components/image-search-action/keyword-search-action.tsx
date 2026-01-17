/**
 * Image Keyword Search Action
 *
 * Keyword 검색 전용 래퍼 (Unsplash + SSOTA Keyword)
 */

'use client';

import React from 'react';

import { Search } from 'lucide-react';

import { ImageSearchAction } from './index';

/**
 * Keyword Search Action Props
 */
export interface ImageKeywordSearchActionProps {
  blockIds: string[];
}

/**
 * Image Keyword Search Action
 *
 * Keyword 검색에 최적화된 래퍼 컴포넌트
 */
export function ImageKeywordSearchAction({
  blockIds,
}: ImageKeywordSearchActionProps): React.ReactElement {
  return (
    <ImageSearchAction
      blockIds={blockIds}
      defaultSearchType="keyword"
      triggerIcon={Search}
      triggerTooltip="Keyword Search"
    />
  );
}
