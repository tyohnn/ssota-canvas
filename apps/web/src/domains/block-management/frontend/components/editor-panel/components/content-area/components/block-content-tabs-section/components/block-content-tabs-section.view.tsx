/**
 * Block Content Tabs Section View
 *
 * 탭 설정을 비동기로 로드하고 탭 UI를 표시하는 Presentational 컴포넌트
 */

'use client';

import { useEffect, useState } from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import {
  TabsContent as ShadcnTabsContent,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/ui/tabs';

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
  const [tabsConfig, setTabsConfig] = useState<BlockEditorTabsConfig | null>(
    null
  );
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTabsConfig(blockType).then(config => {
      setTabsConfig(config);
      if (config) {
        setSelectedTabId(config.defaultTabId || config.tabs[0]?.id || null);
      }
      setLoading(false);
    });
  }, [blockType]);

  if (loading || !tabsConfig) {
    return <TabsLoadingSkeleton />;
  }

  // Note 탭이 없으면 마지막에 추가 (config에 정의되지 않은 경우)
  const hasNoteTab = tabsConfig.tabs.some(tab => tab.id === 'note');
  const effectiveConfig: BlockEditorTabsConfig = {
    ...tabsConfig,
    tabs: hasNoteTab
      ? tabsConfig.tabs
      : [...tabsConfig.tabs, { id: 'note', label: 'Note' } as BlockEditorTab],
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
        {/* 탭 헤더 */}
        <Box className="px-6">
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
