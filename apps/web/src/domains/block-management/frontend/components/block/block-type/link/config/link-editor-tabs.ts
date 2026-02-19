/**
 * Link Block Editor Tabs Config
 *
 * Tab-based editor panel for link blocks. Note is leftmost and default.
 * 이번 버전에서는 요약·추출만 노출 (스크린샷·이미지·디자인은 숨김).
 */
import type { BlockEditorTabsConfig } from '@/domains/block-management/frontend/types/block-editor-tab.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

const linkEditorTabsConfig: BlockEditorTabsConfig = {
  blockType: BlockType.LINK,
  tabs: [
    {
      id: 'note',
      label: 'Note',
      componentPath: 'note-section',
      isDefault: true,
    },
    {
      id: 'summary',
      label: 'Summary',
      componentPath: 'link/components/section-tabs/summary-section',
    },
    {
      id: 'extract',
      label: 'Extract',
      componentPath: 'link/components/section-tabs/extract-section',
    },
  ],
  defaultTabId: 'note',
};

export default linkEditorTabsConfig;
