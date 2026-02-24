/**
 * Summary Content
 *
 * 요약 내용을 표시하는 컴포넌트
 * Note View의 TipTap editor를 재사용하여 요약을 표시
 */

'use client';

import { useEffect, useMemo } from 'react';

import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';

import { Box } from '@/components/ui/box';
import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';
import { convertMarkdownToTiptapJSON } from '@/domains/ai-management/frontend/utils/markdown-to-tiptap';

import { SummaryKeywords } from './summary-keywords';
import { SummaryTableOfContents } from './summary-table-of-contents';
import { useSummaryTOCSlot } from './summary-toc-slot-context';
import {
  extractHeadingsFromTiptapJSON,
} from './summary-table-of-contents/core/utils';

interface SummaryContentProps {
  summary: string;
  keywords?: string[];
}

export function SummaryContent({
  summary,
  keywords = [],
}: SummaryContentProps) {
  const tiptapContent = useMemo(() => {
    if (!summary) {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [],
          },
        ],
      };
    }
    return convertMarkdownToTiptapJSON(summary);
  }, [summary]);

  const editor = useEditor({
    extensions: [StarterKit, Highlight],
    content: tiptapContent,
    editable: false,
    immediatelyRender: false,
  });

  const headings = useMemo(() => {
    return extractHeadingsFromTiptapJSON(tiptapContent);
  }, [tiptapContent]);

  const tocSlot = useSummaryTOCSlot();
  useEffect(() => {
    if (!tocSlot || headings.length === 0) return;
    tocSlot.setTOCData({ tiptapContent, showTOC: true });
    return () => tocSlot.setTOCData(null);
  }, [tocSlot?.setTOCData, tiptapContent, headings.length]);

  useEffect(() => {
    if (editor && tiptapContent) {
      editor.commands.setContent(tiptapContent);

      if (headings.length > 0) {
        setTimeout(() => {
          if (!editor.view?.dom) return;
          const editorDom = editor.view.dom;
          const allHeadings = editorDom.querySelectorAll('h1, h2, h3');

          headings.forEach((heading, index) => {
            const matchingHeadings = Array.from(allHeadings).filter(
              el => el.tagName.toLowerCase() === `h${heading.level}`
            );

            const sameLevelHeadings = headings.filter(h => h.level === heading.level);
            const headingIndex = sameLevelHeadings.findIndex(h => h.id === heading.id);

            if (headingIndex >= 0 && matchingHeadings[headingIndex] && heading.elementId) {
              matchingHeadings[headingIndex].id = heading.elementId;
            }
          });
        }, 200);
      }
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

      <TipTapEditor
        editor={editor}
        editable={false}
        className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:cursor-text [&_.ProseMirror_mark]:font-bold [&_.ProseMirror_mark]:bg-primary/20 [&_.ProseMirror_mark]:dark:bg-primary/30 [&_.ProseMirror_mark]:px-0.5 [&_.ProseMirror_mark]:rounded"
      />

      {!tocSlot && (
        <SummaryTableOfContents
          tiptapContent={tiptapContent}
          showTOC={true}
        />
      )}
    </Box>
  );
}
