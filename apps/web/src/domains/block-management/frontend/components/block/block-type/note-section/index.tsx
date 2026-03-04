/**
 * Note Section (Canvas Note Tab Wrapper)
 *
 * Canvas용 Note 탭 wrapper. useReactFlow, useCanvasReadOnly에서 deps를 획득하고
 * @workspace/editor-panel의 NoteTabView에 editorContent를 주입합니다.
 * Tab configs use componentPath: 'note-section' which resolves here.
 */

'use client';

import { useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

import { NoteTabView } from '@workspace/editor-panel';
import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import type { MarkdownContentSectionProps } from './core/types';
import { useMarkdownContentSection } from './core/use-markdown-content-section';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export default function NoteSection({
  blockId,
  blockData,
}: MarkdownContentSectionProps) {
  const { getNode, updateNode } = useReactFlow();
  const { readonly } = useCanvasReadOnly();
  const contentVersionRef = useRef<number>(blockData.contentVersion ?? 0);

  const { editor, handleEditorClick, mathEditing, setMathEditing } =
    useMarkdownContentSection({
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

  const editorContent =
    editor ? (
      <TipTapEditor
        editor={editor}
        editable={!readonly}
        onClick={handleEditorClick}
        mathEditing={mathEditing}
        onMathEditingChange={setMathEditing}
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
    ) : null;

  return (
    <NoteTabView
      editorContent={editorContent}
      readonly={readonly}
      onEditorClick={handleEditorClick}
    />
  );
}
