/**
 * TipTap Editor Component
 *
 * 재사용 가능한 TipTap 에디터 컴포넌트
 * 편집 모드와 읽기 모드를 모두 지원
 */

'use client';

import { type Editor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { NodeSelection } from '@tiptap/pm/state';

import { cn } from '@workspace/ui/lib/utils';

import { BubbleMenuBar } from './components/bubble-menu-bar';
import { MathEditorPopover } from './components/math-editor-popover';
import type { MathEditingState } from './core/types';

export interface TipTapEditorProps {
  editor: Editor | null;
  editable?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  className?: string;
  placeholderClassName?: string;
  /** @deprecated 스타일이 globals.css의 .prose-editor로 통합되어 더 이상 사용되지 않습니다. */
  placeholderStyleTarget?: string;
  /** LaTeX math editing state (from useTipTapEditor). When set, renders MathEditorPopover. */
  mathEditing?: MathEditingState | null;
  /** Called when math editor closes. Pass setMathEditing from useTipTapEditor. */
  onMathEditingChange?: (state: MathEditingState | null) => void;
}

/**
 * TipTap Editor
 *
 * TipTap EditorContent를 렌더링하는 재사용 가능한 컴포넌트
 */
export function TipTapEditor({
  editor,
  editable = true,
  onClick,
  onDoubleClick,
  className,
  placeholderClassName = 'tiptap-editor',
  placeholderStyleTarget,
  mathEditing,
  onMathEditingChange,
}: TipTapEditorProps) {
  if (!editor) {
    return null;
  }

  const willShowPopover = !!(mathEditing && onMathEditingChange && editable);

  return (
    <>
      {editable && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ state }) => {
            const { selection } = state;
            if (selection.empty) return false;
            if (selection instanceof NodeSelection) return false;
            return true;
          }}
        >
          <BubbleMenuBar editor={editor} />
        </BubbleMenu>
      )}

      {mathEditing && onMathEditingChange && editable && (
        <MathEditorPopover
          editor={editor}
          mathEditing={mathEditing}
          onClose={() => onMathEditingChange(null)}
        />
      )}

      <EditorContent
        editor={editor}
        onClick={onClick}
        onDoubleClick={!editable ? onDoubleClick : undefined}
        className={cn(
          placeholderClassName,
          'prose prose-neutral dark:prose-invert max-w-none',
          'prose-editor',
          'tiptap-block-editor',
          // editable && 'nodrag', // node drag 비활성화
          editable && 'focus:outline-none',
          className
        )}
      />
    </>
  );
}
