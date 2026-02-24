/**
 * Landing Note Section
 * 
 * Replicated from Note Section
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 */

'use client';

import { JSONContent } from '@tiptap/react';
import { NoteSectionView } from '@/domains/block-management/frontend/components/editor-panel/components/content-area/components/block-content-tabs-section/components/sections/note-section/note-section.view';
import { useTipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor/core/use-tiptap-editor';

const DEFAULT_NOTE_CONTENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Notes would appear here.' }],
    },
  ],
};

interface LandingNoteSectionProps {
  content?: JSONContent;
}

export function LandingNoteSection({ content }: LandingNoteSectionProps) {
  const { editor, handleEditorClick, mathEditing, setMathEditing } = useTipTapEditor({
    blockData: { content: content ?? DEFAULT_NOTE_CONTENT } as any,
    placeholder: 'Click to add note...',
    editable: false,
  });

  return (
    <NoteSectionView
      editor={editor}
      readonly={true}
      onEditorClick={handleEditorClick}
      mathEditing={mathEditing}
      onMathEditingChange={setMathEditing}
    />
  );
}
