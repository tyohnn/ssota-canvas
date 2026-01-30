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
          placeholderClassName, // Placeholder 스타일 타겟
          'prose prose-sm max-w-none',
          editable && 'nodrag',
          editable && 'focus:outline-none',
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
          '[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic',
          className
        )}
      />
    </>
  );
}
