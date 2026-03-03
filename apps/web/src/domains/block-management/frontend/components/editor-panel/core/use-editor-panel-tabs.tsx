/**
 * Editor Panel – Tab section logic
 *
 * loadTabsConfig, renderTabContent, prefetch, BlockContentTabsSection deps & node.
 */

'use client';

import React, { useCallback, useEffect, useMemo } from 'react';

import { BlockContentTabsSection } from '@workspace/editor-panel';

import {
  loadTabsConfig,
  prefetchTabs,
  TabMapper,
} from '@/domains/block-management/frontend/components/block-editor-tabs';
import NoteSection from '@/domains/block-management/frontend/components/block/block-type/note-section';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockEditorTab } from '@/domains/block-management/frontend/types/block-editor-tab.types';

export interface UseEditorPanelTabsParams {
  blockId: string;
  blockData: BlockNodeData | undefined;
  setTabSwitchCallback: (fn: ((tabId: string) => void) | null) => void;
  switchToTab: (tabId: string) => void;
  readonly: boolean;
}

export function useEditorPanelTabs({
  blockId,
  blockData,
  setTabSwitchCallback,
  switchToTab,
  readonly,
}: UseEditorPanelTabsParams) {
  const renderTabContent = useCallback(
    (
      tab: import('@workspace/editor-panel').BlockEditorTabLike,
      ctx: {
        blockId: string;
        blockData: unknown;
        blockMountId: string;
        switchToTab: (tabId: string) => void;
      }
    ) => {
      const data = ctx.blockData as BlockNodeData | undefined;
      if (!data) return null;
      if (tab.id === 'note') {
        return <NoteSection blockId={ctx.blockId} blockData={data} />;
      }
      return (
        <TabMapper
          tab={tab as BlockEditorTab}
          blockId={ctx.blockId}
          blockData={data}
          blockMountId={ctx.blockMountId}
          switchToTab={ctx.switchToTab}
        />
      );
    },
    []
  );

  const tabsSectionDeps = useMemo(
    () => ({
      loadTabsConfig,
      renderTabContent,
      registerTabSwitch: setTabSwitchCallback,
      switchToTab,
      readonly,
    }),
    [renderTabContent, switchToTab, setTabSwitchCallback, readonly]
  );

  useEffect(() => {
    if (blockData?.blockType) {
      prefetchTabs(blockData.blockType);
    }
  }, [blockData?.blockType]);

  const tabsSectionNode: React.ReactNode = blockData ? (
    <BlockContentTabsSection
      blockId={blockId}
      blockData={blockData}
      deps={tabsSectionDeps}
    />
  ) : null;

  return { tabsSectionDeps, tabsSectionNode };
}
