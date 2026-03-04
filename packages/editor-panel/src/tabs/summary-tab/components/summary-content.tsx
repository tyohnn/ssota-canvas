'use client';

import { useEffect, useMemo } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import type { JSONContent } from '@tiptap/core';
import { Box } from '@workspace/ui/components/ui/box';
import { SummaryKeywords } from './summary-keywords';
import { SummaryTableOfContents } from './summary-table-of-contents';
import { useSummaryTOCSlot } from './summary-toc-slot-context';
import { extractHeadingsFromTiptapJSON } from './summary-table-of-contents/core/utils';
import type { SummaryContentDeps } from '../types';

export interface SummaryContentProps {
  summary: string;
  keywords?: string[];
  deps: SummaryContentDeps;
}

export function SummaryContent({ summary, keywords = [], deps }: SummaryContentProps) {
  const { TipTapEditorComponent, convertMarkdownToTiptapJSON } = deps;

  const tiptapContent = useMemo(() => {
    if (!summary)
      return { type: 'doc', content: [{ type: 'paragraph', content: [] }] } as JSONContent;
    return convertMarkdownToTiptapJSON(summary);
  }, [summary, convertMarkdownToTiptapJSON]);

  const editor = useEditor({
    extensions: [StarterKit, Highlight],
    content: tiptapContent,
    editable: false,
    immediatelyRender: false,
  });

  const headings = useMemo(() => extractHeadingsFromTiptapJSON(tiptapContent), [tiptapContent]);

  const tocSlot = useSummaryTOCSlot();
  useEffect(() => {
    if (!tocSlot || headings.length === 0) return;
    tocSlot.setTOCData({ tiptapContent, showTOC: true });
    return () => tocSlot.setTOCData(null);
  }, [tocSlot?.setTOCData, tiptapContent, headings.length]);

  useEffect(() => {
    if (!editor || !tiptapContent) return;
    editor.commands.setContent(tiptapContent);
    if (headings.length > 0) {
      const t = setTimeout(() => {
        const editorDom = editor.view?.dom;
        if (!editorDom) return;
        const allHeadings = editorDom.querySelectorAll('h1, h2, h3');
        headings.forEach((heading, idx) => {
          const sameLevel = headings.filter((h) => h.level === heading.level);
          const headingIndex = sameLevel.findIndex((h) => h.id === heading.id);
          if (headingIndex >= 0 && heading.elementId) {
            const matching = Array.from(allHeadings).filter(
              (el) => el.tagName.toLowerCase() === `h${heading.level}`
            );
            const target = matching[headingIndex];
            if (target) target.id = heading.elementId;
          }
        });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [editor, tiptapContent, headings]);

  if (!editor) {
    return (
      <Box>
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </Box>
    );
  }

  return (
    <Box className="relative">
      <SummaryKeywords keywords={keywords} />
      <TipTapEditorComponent
        editor={editor}
        editable={false}
        className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:cursor-text [&_.ProseMirror_mark]:font-bold [&_.ProseMirror_mark]:bg-primary/20 [&_.ProseMirror_mark]:dark:bg-primary/30 [&_.ProseMirror_mark]:px-0.5 [&_.ProseMirror_mark]:rounded"
      />
      {!tocSlot && <SummaryTableOfContents tiptapContent={tiptapContent} showTOC={true} />}
    </Box>
  );
}
