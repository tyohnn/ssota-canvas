/**
 * Audio Block Editor Tabs Config
 *
 * Note, Summary, Timeline 탭 (유튜브 블록과 동일)
 */
import type { BlockEditorTabsConfig } from '@/domains/block-management/frontend/types/block-editor-tab.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

const audioEditorTabsConfig: BlockEditorTabsConfig = {
  blockType: BlockType.AUDIO,
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
      componentPath: 'audio/components/tab-sections/summary-tab',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      componentPath: 'audio/components/tab-sections/timeline-tab',
    },
    {
      id: 'metadata',
      label: 'Metadata',
      componentPath: 'audio/components/tab-sections/metadata-tab',
    },
  ],
  defaultTabId: 'note',
};

export default audioEditorTabsConfig;
