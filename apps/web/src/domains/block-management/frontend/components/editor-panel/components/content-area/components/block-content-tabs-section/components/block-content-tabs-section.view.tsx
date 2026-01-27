/**
 * Block Content Tabs Section View
 *
 * 탭 설정을 비동기로 로드하고 탭 UI를 표시하는 Presentational 컴포넌트
 */

'use client';

import { useEffect, useRef, useState } from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import {
  TabsContent as ShadcnTabsContent,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/ui/tabs';

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

  if (loading) {
    return <TabsLoadingSkeleton />;
  }

  // tabsConfig가 null이면 기본 노트뷰 탭만 포함하는 설정 생성
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

  // tabsConfig가 있으면 사용, 없으면 기본 노트뷰 탭 설정 사용
  const baseConfig = tabsConfig || defaultNoteTabConfig;

  // Note 탭이 없으면 마지막에 추가 (config에 정의되지 않은 경우)
  const hasNoteTab = baseConfig.tabs.some(tab => tab.id === 'note');
  const effectiveConfig: BlockEditorTabsConfig = {
    ...baseConfig,
    tabs: hasNoteTab
      ? baseConfig.tabs
      : [...baseConfig.tabs, { id: 'note', label: 'Note' } as BlockEditorTab],
  };

  const defaultTabId =
    effectiveConfig.defaultTabId ||
    effectiveConfig.tabs[0]?.id ||
    effectiveConfig.tabs[0]?.id;

  return (
    <Box className="my-4">
      <Tabs
        value={selectedTabId || defaultTabId || undefined}
        onValueChange={setSelectedTabId}
      >
        {/* 탭 헤더 - 스크롤 시 상단 고정 */}
        <Box className="sticky top-0 z-10 bg-background px-6 py-2">
          <TabsList className="justify-start">
            {effectiveConfig.tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Box>

        {/* 탭 콘텐츠 */}
        {effectiveConfig.tabs.map(tab => (
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
