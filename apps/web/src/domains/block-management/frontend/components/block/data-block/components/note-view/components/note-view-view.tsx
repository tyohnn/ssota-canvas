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

import type { Editor } from '@tiptap/react';

import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';
import { cn } from '@workspace/ui/lib/utils';

import type { MathEditingState } from '@/domains/block-management/frontend/components/tiptap-editor/core/types';
import type { NoteViewBusinessLogic, NoteViewUIState } from '../core/types';

export interface NoteViewViewProps {
  className?: string;
  selected: boolean;
  readonly?: boolean;
  editor: Editor | null;
  uiState: NoteViewUIState;
  business: NoteViewBusinessLogic;
  mathEditing?: MathEditingState | null;
  onMathEditingChange?: (state: MathEditingState | null) => void;
}

/**
 * Note View View
 *
 * Presentational 컴포넌트 (렌더링만)
 */
export function NoteViewView({
  className,
  selected,
  readonly,
  editor,
  uiState,
  business,
  mathEditing,
  onMathEditingChange,
}: NoteViewViewProps) {
  if (!editor) {
    return null;
  }

  const canScroll = readonly || uiState.isEditing;

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
          'flex-1 p-4',
          canScroll ? 'overflow-auto' : 'overflow-hidden',
          uiState.isEditing ? 'cursor-text' : 'cursor-pointer',
          // 편집 모드일 때만 드래그 방지 (React Flow 선택 허용)
          uiState.isEditing && 'nodrag'
        )}
        onDoubleClick={uiState.handleBlockDoubleClick}
      >
        <TipTapEditor
          editor={editor}
          editable={uiState.isEditing}
          onClick={uiState.isEditing ? uiState.handleEditorClick : undefined}
          onDoubleClick={uiState.handleBlockDoubleClick}
          mathEditing={mathEditing}
          onMathEditingChange={onMathEditingChange}
          placeholderClassName={
            selected && uiState.isDoubleClickMode
              ? 'tiptap-markdown-block'
              : 'tiptap-markdown-readonly'
          }
          placeholderStyleTarget={
            selected && uiState.isDoubleClickMode
              ? 'tiptap-markdown-block'
              : 'tiptap-markdown-readonly'
          }
        />
      </div>
    </div>
  );
}
