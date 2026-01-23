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
import {
  extractHeadingsFromTiptapJSON,
} from './summary-table-of-contents/core/utils';

/**
 * Summary Content Props
 */
interface SummaryContentProps {
  summary: string;
  keywords?: string[];
}

/**
 * Summary Content Component
 *
 * 요약을 TipTap editor로 표시 (읽기 전용)
 */
export function SummaryContent({
  summary,
  keywords = [],
}: SummaryContentProps) {
  // 마크다운을 TipTap JSON으로 변환
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

  // TipTap editor 초기화 (읽기 전용)
  // Highlight extension 추가: <mark> 태그를 지원하기 위해
  const editor = useEditor({
    extensions: [StarterKit, Highlight],
    content: tiptapContent,
    editable: false,
    immediatelyRender: false, // SSR hydration mismatch 방지
  });

  // 헤더 추출
  const headings = useMemo(() => {
    return extractHeadingsFromTiptapJSON(tiptapContent);
  }, [tiptapContent]);

  // summary가 변경되면 editor content 업데이트 및 헤더에 ID 부여
  useEffect(() => {
    if (editor && tiptapContent) {
      editor.commands.setContent(tiptapContent);

      // DOM에 헤더 ID 부여 (다음 tick에서 실행)
      if (headings.length > 0) {
        setTimeout(() => {
          const editorDom = editor.view.dom;
          const allHeadings = editorDom.querySelectorAll('h1, h2, h3');

          headings.forEach((heading, index) => {
            // 순서대로 매칭 (h1, h2, h3 순서대로)
            const matchingHeadings = Array.from(allHeadings).filter(
              el => el.tagName.toLowerCase() === `h${heading.level}`
            );

            // 같은 레벨의 헤더 중에서 순서 찾기
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
      {/* Keywords 배지 (수평 스크롤) */}
      <SummaryKeywords keywords={keywords} />

      {/* Summary 내용 */}
      <TipTapEditor
        editor={editor}
        editable={false}
        className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:cursor-text [&_.ProseMirror_mark]:font-bold [&_.ProseMirror_mark]:bg-primary/20 [&_.ProseMirror_mark]:dark:bg-primary/30 [&_.ProseMirror_mark]:px-0.5 [&_.ProseMirror_mark]:rounded"
      />
      {/* TOC - 항상 표시 (Script 섹션과 동일한 패턴) */}
      <SummaryTableOfContents
        tiptapContent={tiptapContent}
        showTOC={true}
      />
    </Box>
  );
}
