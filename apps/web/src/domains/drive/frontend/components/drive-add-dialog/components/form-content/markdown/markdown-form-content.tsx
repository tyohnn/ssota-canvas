'use client';

import { useCallback, useRef } from 'react';

import Placeholder from '@tiptap/extension-placeholder';
import { useEditor } from '@tiptap/react';

import {
  EMPTY_TIPTAP_DOC,
  MARKDOWN_EXTENSIONS,
} from '@/domains/block-management/shared/utils/tiptap-markdown.utils';

import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';

import { Box } from '@/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';

export interface MarkdownFormContentProps {
  content: object | null;
  onContentChange: (content: object) => void;
  title: string;
  onTitleChange: (value: string) => void;
  workspaceId: string;
  onWorkspaceIdChange: (value: string) => void;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
}

export function MarkdownFormContent({
  content,
  onContentChange,
  title,
  onTitleChange,
  workspaceId,
  onWorkspaceIdChange,
  workspaces,
  isLoadingWorkspaces,
}: MarkdownFormContentProps) {
  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;

  const editor = useEditor({
    immediatelyRender: false,
    content: content ?? EMPTY_TIPTAP_DOC,
    editable: true,
    extensions: [
      ...MARKDOWN_EXTENSIONS,
      Placeholder.configure({
        placeholder: 'Write your markdown content...',
        emptyEditorClass: 'is-editor-empty',
        showOnlyWhenEditable: true,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose-editor tiptap-block-editor min-h-[200px] px-3 py-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onContentChangeRef.current(editor.getJSON());
    },
  });

  const handleEditorClick = useCallback(() => {
    // no-op, focus handled by editor
  }, []);

  return (
    <Box className="flex flex-col gap-4">
      <Box className="space-y-2">
        <p className="text-sm font-medium text-foreground">Content</p>
        <Box
          className={cn(
            'rounded-md border border-border bg-background',
            'prose prose-neutral dark:prose-invert max-w-none',
            'max-h-[280px] overflow-y-auto'
          )}
        >
          <TipTapEditor editor={editor} editable onClick={handleEditorClick} />
        </Box>
      </Box>
    </Box>
  );
}
