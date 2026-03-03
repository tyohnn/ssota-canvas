/**
 * Markdown Content Section Types
 */
import type { RefObject } from 'react';
import type { Node } from '@xyflow/react';
import type { Editor } from '@tiptap/react';

import type { MathEditingState } from '@/domains/block-management/frontend/components/tiptap-editor/core/types';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface MarkdownContentSectionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export interface UseMarkdownContentSectionDependencies {
  reactFlow: {
    getNode: (nodeId: string) => Node | undefined;
    updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
  };
  contentVersionRef?: RefObject<number>;
}

export interface UseMarkdownContentSectionOptions {
  blockData: BlockNodeData;
  dependencies: UseMarkdownContentSectionDependencies;
  readonly?: boolean;
}

export interface UseMarkdownContentSectionReturn {
  editor: Editor | null;
  handleEditorClick: () => void;
  mathEditing: MathEditingState | null;
  setMathEditing: (state: MathEditingState | null) => void;
}
