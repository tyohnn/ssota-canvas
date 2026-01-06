'use client';

import React from 'react';

import { ShadowBlockView } from './components/shadow-block-view';
import { useShadowBlock } from './core/use-shadow-block';

/**
 * ShadowBlockContainer Component
 *
 * Container 컴포넌트 - Hook → Props 변환 (Thin Container)
 * 비즈니스 로직은 Hook에서 처리하고, Props로 Presentational에 전달
 */
export function ShadowBlockContainer() {
  const { isVisible, renderInfo, blockInfo } = useShadowBlock();

  if (!isVisible || !renderInfo || !blockInfo) {
    return null;
  }

  return <ShadowBlockView renderInfo={renderInfo} blockInfo={blockInfo} />;
}
