/**
 * X Block Editor Tabs Config
 *
 * Link 패턴: note / summary / extract / metadata (timeline 없음)
 */
import type { BlockEditorTabsConfig } from '@/domains/block-management/frontend/types/block-editor-tab.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

const xEditorTabsConfig: BlockEditorTabsConfig = {
  blockType: BlockType.X,
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
      componentPath: 'x/components/tab-sections/summary-tab',
    },
    {
      id: 'extract',
      label: 'Extract',
      componentPath: 'x/components/tab-sections/markdown-tab',
    },
    {
      id: 'metadata',
      label: 'Metadata',
      componentPath: 'x/components/tab-sections/metadata-tab',
    },
  ],
  defaultTabId: 'note',
};

export default xEditorTabsConfig;
