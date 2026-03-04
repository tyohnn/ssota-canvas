'use client';

import { useEffect } from 'react';

import 'katex/dist/katex.min.css';
import { useEditor } from '@tiptap/react';

import {
  EMPTY_TIPTAP_DOC,
  MARKDOWN_EXTENSIONS,
} from '@/domains/block-management/shared/utils/tiptap-markdown.utils';
import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';

import { Box } from '@workspace/ui/components/ui/box';

export interface MarkdownPreviewCardProps {
  title: string | null;
  properties: Record<string, unknown>;
  content?: unknown;
}

export function MarkdownPreviewCard({
  content,
}: MarkdownPreviewCardProps) {
  const editor = useEditor({
    immediatelyRender: false,
    content: (content as object) ?? EMPTY_TIPTAP_DOC,
    editable: false,
    extensions: MARKDOWN_EXTENSIONS,
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent((content as object) ?? EMPTY_TIPTAP_DOC);
    }
  }, [editor, content]);

  if (!editor) {
    return (
      <Box className="flex flex-col h-full min-h-0 p-4">
        <p className="text-xs text-muted-foreground">Loading...</p>
      </Box>
    );
  }

  return (
    <Box className="flex h-full flex-col min-h-0 overflow-hidden p-3">
      <TipTapEditor
        editor={editor}
        editable={false}
        className="flex-1 min-h-0 tiptap-markdown-readonly [&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:overflow-y-auto [&_.ProseMirror]:text-sm [&_.ProseMirror]:cursor-default [&_.ProseMirror_p]:my-0.5 [&_.ProseMirror_p:last-child]:mb-0 [&_.ProseMirror_h1]:text-base [&_.ProseMirror_h2]:text-sm [&_.ProseMirror_h3]:text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      />
    </Box>
  );
}
