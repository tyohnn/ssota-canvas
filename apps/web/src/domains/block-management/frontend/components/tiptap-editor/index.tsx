/**
 * TipTap Editor Component
 *
 * 재사용 가능한 TipTap 에디터 컴포넌트
 * 편집 모드와 읽기 모드를 모두 지원
 */

'use client';

import DragHandle from '@tiptap/extension-drag-handle-react';
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

      {/* Drag Handle — 노션 스타일 블록 드래그 */}
      {editable && (
        <DragHandle
          editor={editor}
          nested
          computePositionConfig={{ placement: 'left-start', strategy: 'absolute' }}
        >
          <div
            className="drag-handle-icon"
            style={{
              width: 16,
              height: 16,
              opacity: 0.5,
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden
            >
              <circle cx="5" cy="4" r="1.5" />
              <circle cx="11" cy="4" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="11" cy="12" r="1.5" />
            </svg>
          </div>
        </DragHandle>
      )}

      <EditorContent
        editor={editor}
        onClick={onClick}
        onDoubleClick={!editable ? onDoubleClick : undefined}
        className={cn(
          placeholderClassName, // Placeholder 스타일 타겟 (global .prose와 통일)
          'prose prose-neutral dark:prose-invert max-w-none',
          'tiptap-block-editor',
          editable && 'nodrag',
          editable && 'focus:outline-none',
          // 노션 스타일 블록 단위 스타일
          '[&_.ProseMirror>*]:rounded-md [&_.ProseMirror>*]:px-2 [&_.ProseMirror>*]:py-1 [&_.ProseMirror>*]:min-h-[1.5em]',
          '[&_.ProseMirror>*:hover]:bg-muted/50 [&_.ProseMirror>*:hover]:transition-colors',
          '[&_.ProseMirror>p]:my-0.5 [&_.ProseMirror>h1]:my-2 [&_.ProseMirror>h2]:my-1.5 [&_.ProseMirror>h3]:my-1',
          className
        )}
      />
    </>
  );
}
