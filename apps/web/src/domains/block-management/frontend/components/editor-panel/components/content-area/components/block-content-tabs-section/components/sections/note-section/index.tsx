/**
 * Note Section Container
 *
 * Editor Panel의 Note 탭 컴포넌트
 * 기존 BlockContentSection의 기능을 유지하면서 탭 시스템에 통합
 */

'use client';

import { useReactFlow } from '@xyflow/react';

import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import type { MarkdownContentSectionProps } from './core/types';
import { useMarkdownContentSection } from './core/use-markdown-content-section';
import { NoteSectionView } from './note-section.view';

/**
 * Note Section Component
 *
 * 기존 BlockContentSection의 기능을 유지하면서 Note 탭으로 리팩토링
 */
export default function NoteSection({
  blockId,
  blockData,
}: MarkdownContentSectionProps) {
  const { getNode, updateNode } = useReactFlow();
  const { readonly } = useCanvasReadOnly();
  const { updateBlockContent } = useUpdateBlockContent({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: BlockNodeData }) => {
        updateNode(nodeId, options);
      },
    },
  });

  // Markdown Content Section Hook 사용 (readonly면 에디터 수정 불가)
  const { editor, handleEditorClick } = useMarkdownContentSection({
    blockId,
    blockData,
    readonly,
    dependencies: {
      reactFlow: {
        getNode,
        updateNode: (nodeId: string, options: { data: BlockNodeData }) => {
          updateNode(nodeId, options);
        },
      },
      updateBlockContent,
    },
  });

  return (
    <NoteSectionView
      editor={editor}
      readonly={readonly}
      onEditorClick={handleEditorClick}
    />
  );
}
