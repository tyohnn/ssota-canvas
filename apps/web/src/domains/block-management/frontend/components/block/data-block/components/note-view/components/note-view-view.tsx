/**
 * Note View View Component
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 * - Storybook에서 독립적으로 테스트 가능
 */

'use client';

import { type Editor, EditorContent } from '@tiptap/react';

import { cn } from '@workspace/ui/lib/utils';

import type { NoteViewBusinessLogic, NoteViewUIState } from '../core/types';

export interface NoteViewViewProps {
  className?: string;
  selected: boolean;
  editor: Editor | null;
  uiState: NoteViewUIState;
  business: NoteViewBusinessLogic;
}

/**
 * Note View View
 *
 * Presentational 컴포넌트 (렌더링만)
 */
export function NoteViewView({
  className,
  selected,
  editor,
  uiState,
  business,
}: NoteViewViewProps) {
  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col rounded-lg overflow-hidden',
        'bg-background border-2 border-border',
        'shadow-md',
        // 호버 효과 (선택되지 않았을 때만)
        !selected && 'hover:shadow-xl',
        // 선택 효과
        selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
        selected && 'shadow-xl',
        // Transition
        'transition-all duration-300 ease-out',
        className
      )}
    >
      {/* Editor Content */}
      <div
        ref={uiState.editorContainerRef}
        className={cn(
          'flex-1 p-4 overflow-auto',
          uiState.isEditing ? 'cursor-text' : 'cursor-pointer',
          // 편집 모드일 때만 드래그 방지 (React Flow 선택 허용)
          uiState.isEditing && 'nodrag'
        )}
        onDoubleClick={uiState.handleBlockDoubleClick}
      >
        {selected && uiState.isDoubleClickMode ? (
          // 편집 모드: TipTap 에디터
          <>
            {/* Placeholder 스타일 */}
            <style>{`
              .tiptap-markdown-block p.is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                color: hsl(var(--muted-foreground));
                font-style: italic;
                float: left;
                height: 0;
                pointer-events: none;
              }
            `}</style>

            <EditorContent
              editor={editor}
              onClick={uiState.handleEditorClick}
              className={cn(
                'tiptap-markdown-block', // Placeholder 스타일 타겟
                'prose prose-sm max-w-none nodrag',
                'focus:outline-none',
                // TipTap 기본 스타일
                '[&_.ProseMirror]:outline-none',
                '[&_.ProseMirror]:min-h-[100px]',
                '[&_.ProseMirror_p]:my-2',
                '[&_.ProseMirror_p:first-child]:mt-0',
                '[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-3',
                '[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-2',
                '[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:my-2',
                '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-4',
                '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-4',
                '[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded',
                '[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded',
                '[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic'
              )}
            />
          </>
        ) : (
          // 읽기 모드: TipTap 렌더링 (편집 불가)
          <>
            {/* Placeholder 스타일 */}
            <style>{`
              .tiptap-markdown-readonly p.is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                color: hsl(var(--muted-foreground));
                font-style: italic;
                float: left;
                height: 0;
                pointer-events: none;
              }
            `}</style>

            <EditorContent
              editor={editor}
              className={cn(
                'tiptap-markdown-readonly', // Placeholder 스타일 타겟
                'prose prose-sm max-w-none',
                // 읽기 모드에서는 pointer-events 차단하여 클릭이 wrapper로 전달되도록
                // 단, 더블클릭은 감지되어야 하므로 wrapper div에서 처리
                'pointer-events-none',
                // TipTap 기본 스타일
                '[&_.ProseMirror]:outline-none',
                '[&_.ProseMirror]:min-h-[100px]',
                '[&_.ProseMirror_p]:my-2',
                '[&_.ProseMirror_p:first-child]:mt-0',
                '[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-3',
                '[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-2',
                '[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:my-2',
                '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-4',
                '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-4',
                '[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded',
                '[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded',
                '[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic'
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}
