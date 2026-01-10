/**
 * Markdown Content Section
 *
 * Editor Panel에서 블록 콘텐츠를 편집하는 섹션 (모든 블록 타입)
 * 블록과 동일한 content를 공유하며 실시간 동기화됨
 * Notion 스타일의 깔끔한 에디터
 */

'use client';

import { useReactFlow } from '@xyflow/react';

import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import type { MarkdownContentSectionProps } from './core/types';
import { useMarkdownContentSection } from './core/use-markdown-content-section';

/**
 * Block Content Section for Editor Panel
 *
 * 에디터 패널에서 블록 콘텐츠를 편집하는 섹션 (모든 블록 타입)
 * 블록과 동일한 content를 공유하며 실시간 동기화됨
 * Notion 스타일의 깔끔한 에디터
 */
export function BlockContentSection({
  blockId,
  blockData,
}: MarkdownContentSectionProps) {
  const { getNode, updateNode } = useReactFlow();
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
    <div className="border-t border-border/40 px-4 py-6">
      {/* Notion-style Editor Container */}
      <div onClick={handleEditorClick} className="min-h-[200px] cursor-text">
        <TipTapEditor
          editor={editor}
          editable={true}
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
      </div>
    </div>
  );
}
