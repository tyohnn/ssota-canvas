/**
 * PDF Block Editor Tabs Config
 *
 * Tab-based editor panel for PDF blocks. Note is leftmost and default.
 * Link 블록과 동일하게 note / summary / extract 구성.
 */
import type { BlockEditorTabsConfig } from '@/domains/block-management/frontend/types/block-editor-tab.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

const pdfEditorTabsConfig: BlockEditorTabsConfig = {
  blockType: BlockType.PDF,
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
      componentPath: 'pdf/components/tab-sections/summary-tab',
    },
    {
      id: 'extract',
      label: 'Extract',
      componentPath: 'pdf/components/tab-sections/markdown-tab',
    },
    {
      id: 'metadata',
      label: 'Metadata',
      componentPath: 'pdf/components/tab-sections/metadata-tab',
    },
  ],
  defaultTabId: 'note',
};

export default pdfEditorTabsConfig;
