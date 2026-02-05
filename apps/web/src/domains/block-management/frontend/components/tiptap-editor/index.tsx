/**
 * TipTap Editor Component
 *
 * 재사용 가능한 TipTap 에디터 컴포넌트
 * 편집 모드와 읽기 모드를 모두 지원
 */

'use client';

import { type Editor, EditorContent } from '@tiptap/react';

import { cn } from '@workspace/ui/lib/utils';

export interface TipTapEditorProps {
  editor: Editor | null;
  editable?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  className?: string;
  placeholderClassName?: string;
  placeholderStyleTarget?: string;
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
}: TipTapEditorProps) {
  if (!editor) {
    return null;
  }

  // Note: editable prop은 useTipTapEditor에서 useEditor의 editable 옵션으로 전달됨
  // 여기서 setEditable을 호출하면 불필요한 렌더링이 발생함
  // useEditor가 editable 변경을 자동으로 처리함

  const styleTarget = placeholderStyleTarget || placeholderClassName;

  return (
    <>
      {/* Placeholder 스타일 */}
      <style>{`
        .${styleTarget} p.is-editor-empty:first-child::before {
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
        onClick={onClick}
        onDoubleClick={!editable ? onDoubleClick : undefined}
        className={cn(
          placeholderClassName, // Placeholder 스타일 타겟 (global .prose와 통일)
          'prose prose-neutral dark:prose-invert max-w-none',
          editable && 'nodrag',
          editable && 'focus:outline-none',
          className
        )}
      />
    </>
  );
}
