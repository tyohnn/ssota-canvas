/**
 * Image Semantic Search Action
 *
 * Semantic 검색 전용 래퍼 (SSOTA Semantic)
 */

'use client';

import React from 'react';
import { Brain } from 'lucide-react';
import { ImageSearchAction } from './index';

/**
 * Semantic Search Action Props
 */
export interface ImageSemanticSearchActionProps {
  blockIds: string[];
  orgId: string;
  workspaceId: string;
}

/**
 * Image Semantic Search Action
 *
 * Semantic 검색에 최적화된 래퍼 컴포넌트
 */
export function ImageSemanticSearchAction({
  blockIds,
  orgId,
  workspaceId,
}: ImageSemanticSearchActionProps): React.ReactElement {
  return (
    <ImageSearchAction
      blockIds={blockIds}
      orgId={orgId}
      workspaceId={workspaceId}
      defaultSearchType="semantic"
      triggerIcon={Brain}
      triggerTooltip="Semantic Search"
    />
  );
}
