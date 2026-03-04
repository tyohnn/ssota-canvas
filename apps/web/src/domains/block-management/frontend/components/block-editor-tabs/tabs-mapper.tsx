/**
 * Block Editor Tabs Mapper
 *
 * 블록 타입별 탭 컴포넌트를 동적으로 로드하여 렌더링
 */

'use client';

import { useEffect, useState } from 'react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockEditorTab } from '@/domains/block-management/frontend/types/block-editor-tab.types';

import {
  getTabComponent,
  isTabComponentLoaded,
  prefetchTabComponent,
  type TabComponentProps,
} from './tabs-prefetch';

export interface TabMapperProps {
  tab: BlockEditorTab;
  blockId: string;
  blockData: BlockNodeData | undefined;
  blockMountId?: string;
  switchToTab?: (tabId: string) => void;
}

export function TabMapper({
  tab,
  blockId,
  blockData,
  blockMountId,
  switchToTab,
}: TabMapperProps) {
  const [, forceUpdate] = useState(0);

  if (!tab.componentPath && tab.component) {
    const Component = tab.component;
    return (
      <Component
        blockId={blockId}
        blockData={blockData}
        blockMountId={blockMountId}
        switchToTab={switchToTab}
      />
    );
  }

  if (!tab.componentPath) {
    return null;
  }

  useEffect(() => {
    if (isTabComponentLoaded(tab.componentPath!)) {
      return;
    }
    prefetchTabComponent(tab.componentPath!).catch(() => {});
    const interval = setInterval(() => {
      if (isTabComponentLoaded(tab.componentPath!)) {
        forceUpdate(prev => prev + 1);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [tab.componentPath]);

  const TabComponent = getTabComponent(tab.componentPath!);
  if (!TabComponent) {
    return null;
  }

  const tabProps: TabComponentProps = {
    blockId,
    blockData,
    blockMountId,
    switchToTab,
  };
  return <TabComponent {...tabProps} />;
}
