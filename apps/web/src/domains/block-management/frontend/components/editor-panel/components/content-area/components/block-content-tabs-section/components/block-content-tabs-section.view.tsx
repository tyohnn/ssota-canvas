/**
 * Block Content Tabs Section View
 *
 * 탭 설정을 비동기로 로드하고 탭 UI를 표시하는 Presentational 컴포넌트
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import {
  TabsContent as ShadcnTabsContent,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/ui/tabs';

import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { useEditorPanelContext } from '@/domains/block-management/frontend/components/editor-panel/core/context';
import type {
  BlockEditorTab,
  BlockEditorTabsConfig,
} from '@/domains/block-management/frontend/types/block-editor-tab.types';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { loadTabsConfig } from '../core/block-editor-tabs-registry';
import { TabMapper } from '../core/tabs-mapper';
import NoteSection from './sections/note-section';
import { TabsLoadingSkeleton } from './tabs-loading-skeleton';

export interface BlockContentTabsSectionViewProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
  blockType: string;
}

export function BlockContentTabsSectionView({
  blockId,
  blockData,
  blockType,
}: BlockContentTabsSectionViewProps) {
  const { readonly } = useCanvasReadOnly();
  const { setTabSwitchCallback } = useEditorPanelContext();
  const [tabsConfig, setTabsConfig] = useState<BlockEditorTabsConfig | null>(
    null
  );
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 각 탭의 스크롤 위치 저장
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  // ContentArea의 스크롤 컨테이너 찾기
  const contentAreaRef = useRef<HTMLElement | null>(null);
  const previousTabIdRef = useRef<string | null>(null);

  // 탭 리스트 가로 스크롤 시 좌/우 엣지 페이드 표시
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
      // tabsConfig가 null이면 기본 노트뷰 탭 설정 사용
      if (config) {
        const initialTabId = config.defaultTabId || config.tabs[0]?.id || null;
        setSelectedTabId(initialTabId);
        previousTabIdRef.current = initialTabId;
      } else {
        // 탭이 없는 블록 타입: 기본 노트뷰 탭만 사용
        setSelectedTabId('note');
        previousTabIdRef.current = 'note';
      }
      setLoading(false);
    });
  }, [blockType]);

  // Tab 전환 함수를 Context에 등록
  // ⚠️ useState에 함수를 저장할 때는 () => fn 형태로 감싸야 함
  useEffect(() => {
    setTabSwitchCallback(() => setSelectedTabId);
    return () => {
      setTabSwitchCallback(null);
    };
  }, [setTabSwitchCallback]);

  // ContentArea 스크롤 컨테이너 찾기
  useEffect(() => {
    const findScrollContainer = () => {
      // data attribute로 정확하게 찾기
      const element = document.querySelector(
        '[data-content-area-scroll-container="true"]'
      ) as HTMLElement | null;
      return element;
    };

    // 약간의 지연 후 찾기 (DOM이 완전히 렌더링된 후)
    const timer = setTimeout(() => {
      contentAreaRef.current = findScrollContainer();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 탭 전환 시 스크롤 위치 저장 및 복원
  useEffect(() => {
    if (!selectedTabId || !contentAreaRef.current) return;

    const scrollContainer = contentAreaRef.current;

    // 이전 탭의 스크롤 위치 저장
    if (
      previousTabIdRef.current &&
      previousTabIdRef.current !== selectedTabId
    ) {
      scrollPositionsRef.current.set(
        previousTabIdRef.current,
        scrollContainer.scrollTop
      );
    }

    // 새 탭의 저장된 스크롤 위치 복원
    const savedPosition = scrollPositionsRef.current.get(selectedTabId);

    // DOM 업데이트 완료 후 스크롤 위치 복원
    // 여러 번 requestAnimationFrame을 사용하여 DOM 렌더링 완료 보장
    const restoreScroll = () => {
      if (!scrollContainer) return;

      if (savedPosition !== undefined) {
        scrollContainer.scrollTop = savedPosition;
      } else {
        // 저장된 위치가 없으면 맨 위로
        scrollContainer.scrollTop = 0;
      }
    };

    // 첫 번째 프레임: DOM 업데이트 시작
    requestAnimationFrame(() => {
      // 두 번째 프레임: DOM 업데이트 완료 후 스크롤 복원
      requestAnimationFrame(restoreScroll);
    });

    previousTabIdRef.current = selectedTabId;
  }, [selectedTabId]);

  // 훅 순서 유지를 위해 early return 전에 derived 값과 useEffect 정의
  const defaultNoteTabConfig: BlockEditorTabsConfig = {
    blockType: blockType,
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
  const effectiveConfig: BlockEditorTabsConfig = {
    ...baseConfig,
    tabs: hasNoteTab
      ? baseConfig.tabs
      : [...baseConfig.tabs, { id: 'note', label: 'Note' } as BlockEditorTab],
  };
  const visibleTabs = effectiveConfig.tabs.filter(
    tab => !(tab.hideInReadonly && readonly)
  );
  const defaultTabId =
    effectiveConfig.defaultTabId ||
    effectiveConfig.tabs[0]?.id ||
    effectiveConfig.tabs[0]?.id;
  const effectiveDefaultTabId =
    visibleTabs[0]?.id || defaultTabId || null;
  const effectiveSelectedTabId =
    visibleTabs.some(t => t.id === selectedTabId)
      ? selectedTabId
      : effectiveDefaultTabId;

  // selectedTabId가 숨겨진 탭이면 첫 번째 visible 탭으로 전환 (훅은 early return 위에 두어야 함)
  useEffect(() => {
    if (
      visibleTabs.length > 0 &&
      selectedTabId &&
      !visibleTabs.some(t => t.id === selectedTabId)
    ) {
      setSelectedTabId(effectiveDefaultTabId);
    }
  }, [readonly, selectedTabId, visibleTabs, effectiveDefaultTabId]);

  // 탭 스크롤 영역 마운트/리사이즈 시 페이드 갱신
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

  return (
    <Box className="my-4">
      <Tabs
        value={effectiveSelectedTabId || defaultTabId || undefined}
        onValueChange={setSelectedTabId}
      >
        {/* 탭 헤더 - 스크롤 시 상단 고정, 탭이 많으면 가로 스크롤 (스크롤바 숨김, 엣지 페이드) */}
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

        {/* 탭 콘텐츠 */}
        {visibleTabs.map(tab => (
          <ShadcnTabsContent key={tab.id} value={tab.id}>
            {blockData &&
              (tab.id === 'note' ? (
                // Note 탭은 정적으로 import한 컴포넌트 사용
                <NoteSection blockId={blockId} blockData={blockData} />
              ) : (
                // 다른 탭은 동적 import로 로드
                <TabMapper tab={tab} blockId={blockId} blockData={blockData} />
              ))}
          </ShadcnTabsContent>
        ))}
      </Tabs>
    </Box>
  );
}
