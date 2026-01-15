/**
 * Block Editor Tabs Mapper
 *
 * 블록 타입별 탭 컴포넌트를 동적으로 로드하여 렌더링
 *
 * 패턴: block-action-mapper.tsx와 동일한 Registry 기반 렌더링
 */

'use client';

import { useEffect, useState } from 'react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockEditorTab } from '@/domains/block-management/frontend/types/block-editor-tab.types';

import {
  getTabComponent,
  isTabComponentLoaded,
  prefetchTabComponent,
} from './tabs-prefetch';

export interface TabMapperProps {
  tab: BlockEditorTab;
  blockId: string;
  blockData: BlockNodeData | undefined;
}

/**
 * Tab Mapper Component
 *
 * 개별 탭 컴포넌트를 레지스트리에서 가져와 렌더링
 *
 * 성능 최적화:
 * - Prefetch: config 로드 시 미리 로드하여 컴포넌트 레지스트리에 저장
 * - Lazy Loading 제거: 레지스트리에서 직접 가져와 즉시 렌더링
 * - No Suspense: 미리 로드된 컴포넌트는 즉시 렌더링 (no lag!)
 */
export function TabMapper({ tab, blockId, blockData }: TabMapperProps) {
  const [, forceUpdate] = useState(0);

  // componentPath가 없으면 레거시 component 사용
  if (!tab.componentPath && tab.component) {
    // 레거시: 직접 렌더링
    const Component = tab.component;
    return <Component blockId={blockId} blockData={blockData} />;
  }

  // componentPath가 없으면 렌더링 불가
  if (!tab.componentPath) {
    console.warn(
      `[TabMapper] Tab "${tab.id}" has no componentPath or component`
    );
    return null;
  }

  // 컴포넌트가 로드될 때까지 polling (prefetch 완료 대기)
  useEffect(() => {
    // 이미 로드됨
    if (isTabComponentLoaded(tab.componentPath!)) {
      return;
    }

    // Prefetch 시작
    prefetchTabComponent(tab.componentPath!).catch(err => {
      console.warn(
        `[TabMapper] Failed to prefetch tab component ${tab.componentPath}:`,
        err
      );
    });

    // 로드될 때까지 polling
    const interval = setInterval(() => {
      if (isTabComponentLoaded(tab.componentPath!)) {
        forceUpdate(prev => prev + 1);
        clearInterval(interval);
      }
    }, 50); // 50ms마다 체크

    return () => clearInterval(interval);
  }, [tab.componentPath]);

  // 레지스트리에서 컴포넌트 가져오기
  const TabComponent = getTabComponent(tab.componentPath!);

  // 아직 로드되지 않음 (fallback)
  if (!TabComponent) {
    return null;
  }

  // 컴포넌트 즉시 렌더링 (no Suspense!)
  return <TabComponent blockId={blockId} blockData={blockData} />;
}
