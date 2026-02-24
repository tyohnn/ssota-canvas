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

  const styleTarget = placeholderStyleTarget || placeholderClassName;

  const willShowPopover = !!(mathEditing && onMathEditingChange && editable);

  return (
    <>
      {/* Placeholder, Dropcursor, Admonition, Table, TaskList, Details, Math 스타일 */}
      <style>{`
        .prosemirror-dropcursor-inline { display: none !important; }
        .${styleTarget} p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          font-style: italic;
          float: left;
          height: 0;
          pointer-events: none;
        }

        /* ── Admonition (Callout) ── */
        .${styleTarget} [data-admonition] {
          border-left: 4px solid #6366f1;
          padding: 0.75rem 1rem 0.75rem 1.5rem;
          margin: 0.75rem 0;
          border-radius: 0 6px 6px 0;
          background: rgba(99, 102, 241, 0.08);
          position: relative;
          overflow: visible;
        }
        .${styleTarget} [data-admonition]::before {
          font-weight: 700;
          font-size: 0.85em;
          display: block;
          margin-bottom: 0.35rem;
        }
        .${styleTarget} [data-admonition][data-type="note"] { border-color: #6366f1; background: rgba(99, 102, 241, 0.08); }
        .${styleTarget} [data-admonition][data-type="note"]::before { content: "📌 Note"; color: #6366f1; }
        .${styleTarget} [data-admonition][data-type="warning"] { border-color: #d97706; background: rgba(217, 119, 6, 0.08); }
        .${styleTarget} [data-admonition][data-type="warning"]::before { content: "⚠️ Warning"; color: #d97706; }
        .${styleTarget} [data-admonition][data-type="tip"] { border-color: #16a34a; background: rgba(22, 163, 74, 0.08); }
        .${styleTarget} [data-admonition][data-type="tip"]::before { content: "💡 Tip"; color: #16a34a; }
        .${styleTarget} [data-admonition][data-type="danger"] { border-color: #dc2626; background: rgba(220, 38, 38, 0.08); }
        .${styleTarget} [data-admonition][data-type="danger"]::before { content: "🚨 Danger"; color: #dc2626; }

        /* ── Table ── */
        .${styleTarget} table { border-collapse: collapse; width: 100%; margin: 0.75rem 0; }
        .${styleTarget} td, .${styleTarget} th { border: 1px solid var(--border); padding: 6px 10px; text-align: left; }
        .${styleTarget} th { background: var(--secondary); color: var(--secondary-foreground); font-weight: 600; }

        /* ── Blockquote (Quote) ── */
        .${styleTarget} .ProseMirror blockquote {
          border-width: 0 !important;
          border-left-width: 4px !important;
          border-left-style: solid !important;
          border-left-color: var(--color-muted-foreground, #9ca3af) !important;
          border-radius: 0 !important;
          padding: 0.35em 0 0.35em 1em !important;
          margin: 0.5rem 0 !important;
          font-style: italic;
          background: transparent !important;
          min-height: auto !important;
          opacity: 0.8;
        }

        /* ── Horizontal Rule (Divider) ── */
        .${styleTarget} .ProseMirror hr {
          border-width: 0 !important;
          border-top-width: 1px !important;
          border-top-style: solid !important;
          border-top-color: var(--color-border, #e5e7eb) !important;
          border-radius: 0 !important;
          margin: 1rem 2px !important;
          padding: 0 !important;
          min-height: 0 !important;
          height: 1px;
          background: transparent !important;
        }

        /* ── Task List ── */
        .${styleTarget} ul[data-type="taskList"] { list-style: none !important; padding-left: 0 !important; margin: 0 !important; margin-left: 0 !important; }
        .${styleTarget} ul[data-type="taskList"] > li { list-style: none !important; display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; align-items: flex-start; gap: 0.5rem; padding: 0; margin: 0 0 4px 0; }
        .${styleTarget} ul[data-type="taskList"] > li > label { display: inline-flex !important; flex-shrink: 0 !important; width: auto !important; margin: 0 !important; padding-top: calc((1.5 - 1) / 2 * 1em); align-items: center; cursor: pointer; }
        .${styleTarget} ul[data-type="taskList"] > li > div { flex: 1 1 0% !important; min-width: 0 !important; }
        .${styleTarget} ul[data-type="taskList"] > li > div p { margin-top: 0 !important; margin-bottom: 0 !important; }

        /* ── Slash Command (진행 중인 트리거 영역 배지) ── */
        .${styleTarget} .slash-command-trigger {
          display: inline-flex;
          align-items: center;
          background: var(--accent);
          color: var(--accent-foreground);
          padding: 0.15em 0.5em;
          border-radius: 6px;
          font-size: 0.9em;
          line-height: 1.3;
          box-sizing: border-box;
        }
        .${styleTarget} .slash-command-trigger.slash-command-trigger-empty::after {
          content: " Filter...";
          opacity: 0.85;
          margin-left: 0.05em;
        }

        /* ── 토글 (Collapsible) ── */
        .${styleTarget} [data-type="details"] {
          margin: 0.25rem 0;
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto 1fr;
          gap: 0 0.25rem;
          align-items: baseline;
        }
        .${styleTarget} [data-type="details"] > button {
          grid-row: 1;
          grid-column: 1;
          cursor: pointer;
          background: transparent;
          border: none;
          padding: 0;
          font-size: 0.75em;
          line-height: inherit;
          transition: transform 0.2s;
        }
        .${styleTarget} [data-type="details"] > button::before {
          content: "▶ ";
          display: inline-block;
        }
        .${styleTarget} [data-type="details"].is-open > button::before {
          transform: rotate(90deg);
        }
        .${styleTarget} [data-type="details"] > div {
          grid-row: 1 / -1;
          grid-column: 2;
          display: flex;
          flex-direction: column;
        }
        .${styleTarget} [data-type="details"] > div > summary {
          cursor: pointer;
          font-weight: 600;
          list-style: none;
          padding: 0.1rem 0;
          user-select: none;
        }
        .${styleTarget} [data-type="details"] > div > summary::-webkit-details-marker { display: none; }
        .${styleTarget} [data-type="details"] [data-type="detailsContent"] {
          margin-top: 0.5rem;
        }

        /* ── Math (LaTeX) ── */
        .${styleTarget} .tiptap-mathematics-render {
          cursor: pointer;
          border-radius: 4px;
          padding: 2px 4px;
          min-height: 1.8em;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .${styleTarget} .tiptap-mathematics-render:hover {
          background: rgba(99, 102, 241, 0.08);
        }
        .${styleTarget} .tiptap-mathematics-render[data-latex=""]::after,
        .${styleTarget} .tiptap-mathematics-render:empty::after {
          content: 'Click to edit equation';
          color: hsl(var(--muted-foreground));
          font-style: italic;
          font-size: 0.875rem;
        }
        /* 선택된 노드: React Flow block과 동일한 링 색상 (math, image, table 등 모든 NodeSelection 대상) */
        .${styleTarget} .ProseMirror-selectednode {
          box-shadow: 0 0 0 2px rgb(96 165 250);
          border-radius: 4px;
        }
        .dark .${styleTarget} .ProseMirror-selectednode {
          box-shadow: 0 0 0 2px rgb(59 130 246);
        }
      `}</style>

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
          editable && 'nodrag',
          editable && 'focus:outline-none',
          className
        )}
      />
    </>
  );
}
