/**
 * Math Editor Popover
 *
 * Notion-style LaTeX editor: textarea + live KaTeX preview.
 * Opens when clicking a math node or inserting via slash command.
 */

'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import katex from 'katex';
import { Trash2 } from 'lucide-react';
import type { Editor } from '@tiptap/react';

import type { MathEditingState } from '../core/types';

export interface MathEditorPopoverProps {
  editor: Editor;
  mathEditing: MathEditingState;
  onClose: () => void;
}

export function MathEditorPopover({
  editor,
  mathEditing,
  onClose,
}: MathEditorPopoverProps) {
  const { pos, latex, nodeType } = mathEditing;
  const [value, setValue] = useState(latex);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync value when mathEditing changes (e.g. switching nodes)
  useEffect(() => {
    setValue(latex);
  }, [pos, latex]);

  // Focus textarea on mount
  useLayoutEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(value.length, value.length);
  }, []);

  const updateNode = useCallback(
    (newLatex: string) => {
      if (newLatex.trim() === '') {
        // 빈 상태면 노드를 삭제하지 않고 그대로 유지 (placeholder 표시)
        return;
      }
      if (nodeType === 'blockMath') {
        editor.chain().focus().updateBlockMath({ latex: newLatex, pos }).run();
      } else {
        editor.chain().focus().updateInlineMath({ latex: newLatex, pos }).run();
      }
    },
    [editor, pos, nodeType]
  );

  const handleClose = useCallback(() => {
    updateNode(value);
    onClose();
    editor.commands.focus();
  }, [value, updateNode, onClose, editor]);

  const handleDelete = useCallback(() => {
    if (nodeType === 'blockMath') {
      editor.chain().focus().deleteBlockMath({ pos }).run();
    } else {
      editor.chain().focus().deleteInlineMath({ pos }).run();
    }
    onClose();
    editor.commands.focus();
  }, [editor, pos, nodeType, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Enter') {
        if (e.metaKey || e.ctrlKey) {
          // Cmd+Enter / Ctrl+Enter = insert newline (no default in textarea)
          e.preventDefault();
          const ta = e.currentTarget;
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          const next = value.slice(0, start) + '\n' + value.slice(end);
          setValue(next);
          requestAnimationFrame(() => {
            ta.setSelectionRange(start + 1, start + 1);
          });
        } else {
          // Enter alone = Done
          e.preventDefault();
          handleClose();
        }
      }
    },
    [handleClose, value]
  );

  // Position popover below the math node (node's bottom edge + gap).
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    try {
      const { state, view } = editor;
      const node = state.doc.nodeAt(pos);
      const nodeSize = node?.nodeSize ?? 2;
      const GAP = 28;
      const maxPos = Math.min(pos + nodeSize - 1, state.doc.content.size - 1);
      const selector =
        '[data-type="block-math"], [data-type="inline-math"], .tiptap-mathematics-render';

      let rect: DOMRect | { bottom: number; left: number } | null = null;
      for (const p of [pos, pos + 1, maxPos]) {
        if (p < 0 || p > state.doc.content.size) continue;
        const dom = view.domAtPos(p);
        const el = dom.node instanceof HTMLElement ? dom.node : dom.node.parentElement;
        const mathEl = el?.closest?.(selector);
        if (mathEl) {
          rect = mathEl.getBoundingClientRect();
          break;
        }
      }

      if (!rect) {
        // coordsAtPos는 한 줄 높이만 반환 → 여러 줄 블록 시 노드 중간에 붙음.
        // pos와 pos+nodeSize-1의 coords를 합쳐 블록 전체 세로 범위 사용.
        const topCoords = view.coordsAtPos(pos);
        const bottomCoords = view.coordsAtPos(maxPos);
        rect = {
          bottom: bottomCoords.bottom,
          left: topCoords.left,
        } as DOMRect;
      }

      setPosition({ top: rect.bottom + GAP, left: rect.left });
    } catch {
      try {
        const coords = editor.view.coordsAtPos(pos);
        setPosition({ top: coords.bottom + 32, left: coords.left });
      } catch {
        setPosition({ top: 100, left: 100 });
      }
    }
  }, [editor, pos]);

  // Click outside popover to close (including clicks inside editor)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClose, editor]);

  // Live KaTeX preview
  const previewHtml = (() => {
    if (!value.trim()) return '';
    try {
      return katex.renderToString(value, {
        throwOnError: false,
        displayMode: nodeType === 'blockMath',
      });
    } catch {
      return '<span class="text-destructive text-sm">Invalid LaTeX</span>';
    }
  })();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={popoverRef}
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed z-9999 min-w-[280px] max-w-[420px] rounded-lg border border-border bg-background shadow-lg"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Equation</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded border border-input bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded p-0.5 text-destructive hover:bg-destructive/10"
            aria-label="Delete equation"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="p-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type LaTeX (e.g. E = mc^2, \\frac{a}{b}). Cmd+Enter for newline"
          className="mb-2 w-full resize-none rounded border border-input bg-background px-2.5 py-1.5 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={2}
          spellCheck={false}
        />
        {value.trim() && (
          <div
            className="rounded border border-border bg-muted/30 px-2.5 py-2 [&_.katex]:text-sm"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
