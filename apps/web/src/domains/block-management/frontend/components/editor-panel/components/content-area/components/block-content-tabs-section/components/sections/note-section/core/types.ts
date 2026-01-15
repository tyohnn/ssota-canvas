/**
 * Markdown Content Section Types
 *
 * Editor Panel의 Markdown Content Section 관련 타입 정의
 */
import type { Editor } from '@tiptap/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface MarkdownContentSectionProps {
  blockId: string; // React Flow node id (blockMountId)
  blockData: BlockNodeData;
}

export interface UseMarkdownContentSectionDependencies {
  reactFlow: {
    getNode: (nodeId: string) => any;
    updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
  };
  updateBlockContent: (input: {
    nodeId: string;
    content: unknown;
    blockData: BlockNodeData;
    contentRaw?: string;
  }) => Promise<boolean>;
}

export interface UseMarkdownContentSectionReturn {
  editor: Editor | null;
  handleEditorClick: () => void;
}
