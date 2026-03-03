/**
 * Note Section
 *
 * Editor Panel의 Note 탭 컴포넌트
 * Tab configs use componentPath: 'note-section' which resolves here.
 */

'use client';

import { useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import type { MarkdownContentSectionProps } from './core/types';
import { useMarkdownContentSection } from './core/use-markdown-content-section';
import { NoteSectionView } from './note-section.view';

export default function NoteSection({
  blockId,
  blockData,
}: MarkdownContentSectionProps) {
  const { getNode, updateNode } = useReactFlow();
  const { readonly } = useCanvasReadOnly();
  const contentVersionRef = useRef<number>(blockData.contentVersion ?? 0);

  const { editor, handleEditorClick, mathEditing, setMathEditing } = useMarkdownContentSection({
    blockData,
    readonly,
    dependencies: {
      reactFlow: {
        getNode,
        updateNode: (nodeId: string, options: { data: BlockNodeData }) => {
          updateNode(nodeId, options);
        },
      },
      contentVersionRef,
    },
  });

  return (
    <NoteSectionView
      editor={editor}
      readonly={readonly}
      onEditorClick={handleEditorClick}
      mathEditing={mathEditing}
      onMathEditingChange={setMathEditing}
    />
  );
}
