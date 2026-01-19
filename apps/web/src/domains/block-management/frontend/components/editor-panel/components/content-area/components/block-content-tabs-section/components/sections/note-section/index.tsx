/**
 * Note Section
 *
 * Editor Panel의 Note 탭 컴포넌트
 * 기존 BlockContentSection의 기능을 유지하면서 탭 시스템에 통합
 */

'use client';

import { useReactFlow } from '@xyflow/react';

import { Box } from '@/components/ui/box';
import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import type { MarkdownContentSectionProps } from './core/types';
import { useMarkdownContentSection } from './core/use-markdown-content-section';

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

  // Markdown Content Section Hook 사용
  const { editor, handleEditorClick } = useMarkdownContentSection({
    blockId,
    blockData,
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

  // Early return은 모든 Hook 호출 이후
  if (!editor) {
    return null;
  }

  return (
    <Box className="pl-6 pr-4 py-3 min-h-[200px]" data-note-section="true">
      {/* Notion-style Editor Container */}
      <Box onClick={handleEditorClick} className="min-h-[200px] cursor-text">
        <TipTapEditor
          editor={editor}
          editable={!readonly}
          onClick={handleEditorClick}
          placeholderClassName="tiptap-editor-panel"
          placeholderStyleTarget="tiptap-editor-panel"
          className={`
            [&_.ProseMirror]:min-h-[200px]
            [&_.ProseMirror_p:last-child]:mb-0
            [&_.ProseMirror_h1]:my-4
            [&_.ProseMirror_h2]:my-3
            [&_.ProseMirror_ul]:my-2
            [&_.ProseMirror_ol]:my-2
            [&_.ProseMirror_li]:my-1
            [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:text-sm [&_.ProseMirror_code]:font-mono
            [&_.ProseMirror_pre]:my-3 [&_.ProseMirror_pre]:overflow-x-auto
            [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0
            [&_.ProseMirror_blockquote]:border-muted-foreground/30 [&_.ProseMirror_blockquote]:my-3
            [&_.ProseMirror_hr]:border-border [&_.ProseMirror_hr]:my-4
          `}
        />
      </Box>
    </Box>
  );
}
