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

import { Box } from '@/components/ui/box';
import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';
import { convertMarkdownToTiptapJSON } from '@/domains/ai-management/frontend/utils/markdown-to-tiptap';

/**
 * Summary Content Props
 */
interface SummaryContentProps {
  summary: string;
}

/**
 * Summary Content Component
 *
 * 요약을 TipTap editor로 표시 (읽기 전용)
 */
export function SummaryContent({
  summary,
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
  const editor = useEditor({
    extensions: [StarterKit],
    content: tiptapContent,
    editable: false,
    immediatelyRender: false, // SSR hydration mismatch 방지
  });

  // summary가 변경되면 editor content 업데이트
  useEffect(() => {
    if (editor && tiptapContent) {
      editor.commands.setContent(tiptapContent);
    }
  }, [editor, tiptapContent]);

  if (!editor) {
    return (
      <Box>
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </Box>
    );
  }

  return (
    <TipTapEditor
      editor={editor}
      editable={false}
      className="[&_.ProseMirror]:min-h-[200px]"
    />
  );
}
