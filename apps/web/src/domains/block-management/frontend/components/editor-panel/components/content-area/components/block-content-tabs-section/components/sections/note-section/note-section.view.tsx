/**
 * Note Section View
 * 
 * Presentational component for Note Section
 */

'use client';

import { Box } from '@/components/ui/box';
import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';
import type { Editor } from '@tiptap/react';

export interface NoteSectionViewProps {
  editor: Editor | null;
  readonly: boolean;
  onEditorClick?: () => void;
}

export function NoteSectionView({
  editor,
  readonly,
  onEditorClick,
}: NoteSectionViewProps) {
  if (!editor) {
    return null;
  }

  return (
    <Box className="pl-6 pr-4 py-3 min-h-[200px]" data-note-section="true">
      {/* Notion-style Editor Container (readonly면 클릭해도 포커스/편집 불가) */}
      <Box
        onClick={readonly ? undefined : onEditorClick}
        className={readonly ? 'min-h-[200px] cursor-default' : 'min-h-[200px] cursor-text'}
      >
        <TipTapEditor
          editor={editor}
          editable={!readonly}
          onClick={onEditorClick}
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
