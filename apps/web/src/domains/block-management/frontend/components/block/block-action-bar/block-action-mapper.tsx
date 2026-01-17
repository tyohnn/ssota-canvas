'use client';

import React, { useEffect, useState } from 'react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import {
  BLOCK_ACTION_MODULES,
  getActionComponent,
  isActionLoaded,
} from './action-prefetch';

export interface BlockActionMapperProps {
  blockId: string;
  blockType: string;
  blockData: BlockNodeData;
}

/**
 * BlockActionMapper Component (Registry 기반)
 *
 * 블록 타입에 따라 적절한 액션 아이템들을 동적으로 로드하여 렌더링
 *
 * 성능 최적화:
 * - Prefetch: base-block에서 미리 로드하여 컴포넌트 레지스트리에 저장
 * - Lazy Loading 제거: 레지스트리에서 직접 가져와 즉시 렌더링
 * - No Suspense: 미리 로드된 컴포넌트는 즉시 렌더링 (no lag!)
 */
export function BlockActionMapper({
  blockId,
  blockType,
  blockData,
}: BlockActionMapperProps) {
  const [, forceUpdate] = useState(0);

  // 컴포넌트가 로드될 때까지 polling (prefetch 완료 대기)
  useEffect(() => {
    if (!BLOCK_ACTION_MODULES[blockType]) {
      return;
    }

    // 이미 로드됨
    if (isActionLoaded(blockType)) {
      return;
    }

    // 로드될 때까지 polling
    const interval = setInterval(() => {
      if (isActionLoaded(blockType)) {
        forceUpdate(prev => prev + 1);
        clearInterval(interval);
      }
    }, 50); // 50ms마다 체크

    return () => clearInterval(interval);
  }, [blockType]);

  // Action Items가 없는 블록
  if (!BLOCK_ACTION_MODULES[blockType]) {
    return null;
  }

  // 레지스트리에서 컴포넌트 가져오기
  const ActionItemsComponent = getActionComponent(blockType);

  // 아직 로드되지 않음 (fallback)
  if (!ActionItemsComponent) {
    return null;
  }

  // 컴포넌트 즉시 렌더링 (no Suspense!)
  return <ActionItemsComponent blockId={blockId} blockData={blockData} />;
}
