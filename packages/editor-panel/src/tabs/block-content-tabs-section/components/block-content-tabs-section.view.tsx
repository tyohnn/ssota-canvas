/**
 * Block Content Tabs Section View
 *
 * Generic tabs shell with deps-driven API (loadTabsConfig, renderTabContent, registerTabSwitch, readonly)
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import {
  TabsContent as ShadcnTabsContent,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/ui/tabs';

import type {
  BlockContentTabsSectionDeps,
  BlockEditorTabLike,
  BlockEditorTabsConfigLike,
} from '../../types';

import { TabsLoadingSkeleton } from './tabs-loading-skeleton';

export interface BlockContentTabsSectionViewProps {
  resourceId: string;
  data: unknown;
  blockType: string;
  deps: BlockContentTabsSectionDeps;
}

export function BlockContentTabsSectionView({
  resourceId,
  data,
  blockType,
  deps,
}: BlockContentTabsSectionViewProps) {
  const {
    loadTabsConfig,
    renderTabContent,
    registerTabSwitch,
    switchToTab,
    readonly = false,
  } = deps;

  const instanceId = (data as { blockMountId?: string })?.blockMountId ?? resourceId;

  const [tabsConfig, setTabsConfig] =
    useState<BlockEditorTabsConfigLike | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const contentAreaRef = useRef<HTMLElement | null>(null);
  const previousTabIdRef = useRef<string | null>(null);

  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const updateTabsScrollFade = useCallback(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const threshold = 2;
    setShowLeftFade(scrollLeft > threshold);
    setShowRightFade(scrollLeft + clientWidth < scrollWidth - threshold);
  }, []);

  useEffect(() => {
    loadTabsConfig(blockType).then(config => {
      setTabsConfig(config);
      if (config) {
        const initialTabId = config.defaultTabId || config.tabs[0]?.id || null;
        setSelectedTabId(initialTabId);
        previousTabIdRef.current = initialTabId;
      } else {
        setSelectedTabId('note');
        previousTabIdRef.current = 'note';
      }
      setLoading(false);
    });
  }, [blockType, loadTabsConfig]);

  useEffect(() => {
    registerTabSwitch(setSelectedTabId);
    return () => {
      registerTabSwitch(null);
    };
  }, [registerTabSwitch]);

  useEffect(() => {
    const findScrollContainer = () => {
      const element = document.querySelector(
        '[data-content-area-scroll-container="true"]'
      ) as HTMLElement | null;
      return element;
    };
    const timer = setTimeout(() => {
      contentAreaRef.current = findScrollContainer();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedTabId || !contentAreaRef.current) return;
    const scrollContainer = contentAreaRef.current;

    if (
      previousTabIdRef.current &&
      previousTabIdRef.current !== selectedTabId
    ) {
      scrollPositionsRef.current.set(
        previousTabIdRef.current,
        scrollContainer.scrollTop
      );
    }

    const savedPosition = scrollPositionsRef.current.get(selectedTabId);

    const restoreScroll = () => {
      if (!scrollContainer) return;
      if (savedPosition !== undefined) {
        scrollContainer.scrollTop = savedPosition;
      } else {
        scrollContainer.scrollTop = 0;
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(restoreScroll);
    });

    previousTabIdRef.current = selectedTabId;
  }, [selectedTabId]);

  const defaultNoteTabConfig: BlockEditorTabsConfigLike = {
    blockType,
    tabs: [
      {
        id: 'note',
        label: 'Note',
        componentPath: 'note-section',
        isDefault: true,
      },
    ],
    defaultTabId: 'note',
  };

  const baseConfig = tabsConfig || defaultNoteTabConfig;
  const hasNoteTab = baseConfig.tabs.some(tab => tab.id === 'note');
  const effectiveConfig: BlockEditorTabsConfigLike = {
    ...baseConfig,
    tabs: hasNoteTab
      ? baseConfig.tabs
      : [...baseConfig.tabs, { id: 'note', label: 'Note' } as BlockEditorTabLike],
  };

  const visibleTabs = effectiveConfig.tabs.filter(
    tab => !(tab.hideInReadonly && readonly)
  );
  const defaultTabId =
    effectiveConfig.defaultTabId ||
    effectiveConfig.tabs[0]?.id ||
    effectiveConfig.tabs[0]?.id;
  const effectiveDefaultTabId = visibleTabs[0]?.id || defaultTabId || null;
  const effectiveSelectedTabId =
    visibleTabs.some(t => t.id === selectedTabId)
      ? selectedTabId
      : effectiveDefaultTabId;

  useEffect(() => {
    if (
      visibleTabs.length > 0 &&
      selectedTabId &&
      !visibleTabs.some(t => t.id === selectedTabId)
    ) {
      setSelectedTabId(effectiveDefaultTabId);
    }
  }, [readonly, selectedTabId, visibleTabs, effectiveDefaultTabId]);

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    updateTabsScrollFade();
    const ro = new ResizeObserver(updateTabsScrollFade);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateTabsScrollFade, visibleTabs.length]);

  if (loading) {
    return <TabsLoadingSkeleton />;
  }

  const content = (
    <Box className="my-4">
      <Tabs
        value={effectiveSelectedTabId || defaultTabId || undefined}
        onValueChange={setSelectedTabId}
      >
        <Box className="sticky top-0 z-10 min-w-0 bg-background px-3 py-2">
          <Box className="relative w-full">
            <Box
              ref={tabsScrollRef}
              onScroll={updateTabsScrollFade}
              className="w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-md"
            >
              <TabsList className="flex-nowrap w-max min-w-full justify-start">
                {visibleTabs.map(tab => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="shrink-0 flex-none"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Box>
            {showLeftFade && (
              <Box
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 bottom-0 z-1 w-6 bg-linear-to-r from-background to-transparent"
              />
            )}
            {showRightFade && (
              <Box
                aria-hidden
                className="pointer-events-none absolute right-0 top-0 bottom-0 z-1 w-6 bg-linear-to-l from-background to-transparent"
              />
            )}
          </Box>
        </Box>

        {visibleTabs.map(tab => (
          <ShadcnTabsContent key={tab.id} value={tab.id}>
            {data
              ? (renderTabContent(tab, {
                  resourceId,
                  data,
                  instanceId,
                  switchToTab,
                }) as React.ReactNode)
              : null}
          </ShadcnTabsContent>
        ))}
      </Tabs>
    </Box>
  );

  return content;
}
