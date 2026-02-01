/**
 * YouTube Block Editor Tabs Config
 *
 * YouTube 블록의 에디터 패널 탭 설정
 *
 * 컴포넌트는 block-content-tabs-section/core/tabs-prefetch.ts에서
 * 동적으로 로드됩니다 (block-action-bar 패턴과 동일)
 */
import type { BlockEditorTabsConfig } from '@/domains/block-management/frontend/types/block-editor-tab.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

/**
 * YouTube 블록 에디터 탭 설정
 *
 * componentPath는 block-content-tabs-section/core/tabs-prefetch.ts에서
 * 동적으로 import하는 경로입니다.
 */
const youtubeEditorTabsConfig: BlockEditorTabsConfig = {
  blockType: BlockType.YOUTUBE,
  tabs: [
    {
      id: 'summary',
      label: 'Summary',
      componentPath: 'youtube/components/section-tabs/summary-section',
      isDefault: true,
    },
    {
      id: 'script',
      label: 'Script',
      componentPath: 'youtube/components/section-tabs/script-section',
      hideInReadonly: true,
    },
    {
      id: 'note',
      label: 'Note',
      componentPath: 'note-section', // 정적 컴포넌트로 교체됨 (view에서 처리)
    },
    {
      id: 'metadata',
      label: 'Metadata',
      componentPath: 'youtube/components/section-tabs/metadata-section',
    },
  ],
  defaultTabId: 'summary',
};

export default youtubeEditorTabsConfig;
