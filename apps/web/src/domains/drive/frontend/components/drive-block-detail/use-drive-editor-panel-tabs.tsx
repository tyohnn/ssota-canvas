/**
 * Drive Editor Panel Tabs
 *
 * Uses DriveTabRenderer for all tabs (summary, timeline, extract, metadata, note).
 * No block-management TabMapper; no Canvas context required.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  BlockContentTabsSection,
  type BlockEditorTabLike,
} from '@workspace/editor-panel';

import {
  loadTabsConfig,
  prefetchTabs,
} from '@/domains/block-management/frontend/components/block-editor-tabs';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import { DriveTabRenderer } from './tabs/drive-tab-renderer';

export interface UseDriveEditorPanelTabsParams {
  blockId: string;
  blockData: DriveBlockData | undefined;
  orgId: string;
}

export function useDriveEditorPanelTabs({
  blockId,
  blockData,
  orgId,
}: UseDriveEditorPanelTabsParams) {
  const tabSwitchRef = useRef<((tabId: string) => void) | null>(null);
  const [tabSwitchCallback, setTabSwitchCallbackState] = useState<
    ((tabId: string) => void) | null
  >(null);

  const setTabSwitchCallback = useCallback(
    (fn: ((tabId: string) => void) | null) => {
      tabSwitchRef.current = fn;
      setTabSwitchCallbackState(() => fn);
    },
    []
  );

  const switchToTab = useCallback((tabId: string) => {
    tabSwitchRef.current?.(tabId);
  }, []);

  const renderTabContent = useCallback(
    (
      tab: BlockEditorTabLike,
      ctx: {
        resourceId: string;
        data: unknown;
        instanceId: string;
        switchToTab: (tabId: string) => void;
      }
    ) => {
      const data = ctx.data as DriveBlockData | undefined;
      if (!data) return null;
      return (
        <DriveTabRenderer
          tabId={tab.id}
          componentPath={tab.componentPath ?? null}
          blockId={ctx.resourceId}
          blockData={data}
          blockMountId={ctx.instanceId}
          orgId={orgId}
          switchToTab={ctx.switchToTab}
        />
      );
    },
    [orgId]
  );

  const tabsSectionDeps = useMemo(
    () => ({
      loadTabsConfig,
      renderTabContent,
      registerTabSwitch: setTabSwitchCallback,
      switchToTab,
      readonly: false,
    }),
    [renderTabContent, setTabSwitchCallback]
  );

  useEffect(() => {
    if (blockData?.blockType) {
      prefetchTabs(blockData.blockType);
    }
  }, [blockData?.blockType]);

  const tabsSectionNode: React.ReactNode = blockData ? (
    <BlockContentTabsSection
      resourceId={blockId}
      data={blockData}
      deps={tabsSectionDeps}
    />
  ) : null;

  return { tabsSectionNode, tabsSectionDeps };
}
