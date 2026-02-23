/**
 * SafeDropcursor Extension
 *
 * prosemirror-dropcursor의 두 가지 버그를 수정한 대체 구현:
 *
 * 1. destroy()가 setTimeout을 취소하지 않아, editor 언마운트 후 타이머가 발화하면
 *    element.parentNode.removeChild(element) 실행 시 부모가 이미 변경되어
 *    "Failed to execute 'removeChild' on 'Node'" 에러가 발생하는 문제 수정.
 *
 * 2. removeChild 대신 element.remove() 사용해 DOM 상태와 무관하게 안전하게 제거.
 */

import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { dropPoint } from '@tiptap/pm/transform';
import type { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

export interface SafeDropcursorOptions {
  color?: string | false;
  width?: number;
  class?: string;
}

class SafeDropCursorView {
  private width: number;
  private color: string | undefined;
  private class: string | undefined;
  private cursorPos: number | null = null;
  private element: HTMLElement | null = null;
  private timeout: ReturnType<typeof setTimeout> | undefined;
  private handlers: { name: string; handler: (event: Event) => void }[];

  constructor(
    private readonly editorView: EditorView,
    options: SafeDropcursorOptions
  ) {
    this.width = options.width ?? 1;
    this.color = options.color === false ? undefined : (options.color || 'black');
    this.class = options.class;

    this.handlers = (['dragover', 'dragend', 'drop', 'dragleave'] as const).map(
      name => {
        const handler = (e: Event) => {
          const method = this[name];
          if (typeof method === 'function') method.call(this, e as DragEvent);
        };
        editorView.dom.addEventListener(name, handler);
        return { name, handler };
      }
    );
  }

  destroy() {
    // Fix 1: 타임아웃을 취소해 언마운트 후 removeChild 에러 방지
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
    }
    this.handlers.forEach(({ name, handler }) =>
      this.editorView.dom.removeEventListener(name, handler)
    );
  }

  update(_editorView: EditorView, prevState: EditorState) {
    if (this.cursorPos != null && prevState.doc !== this.editorView.state.doc) {
      if (this.cursorPos > this.editorView.state.doc.content.size) {
        this.setCursor(null);
      } else {
        this.updateOverlay();
      }
    }
  }

  private setCursor(pos: number | null) {
    if (pos === this.cursorPos) return;
    this.cursorPos = pos;
    if (pos == null) {
      // Fix 2: element.remove() 는 parentNode가 없어도 에러가 발생하지 않음
      this.element?.remove();
      this.element = null;
    } else {
      this.updateOverlay();
    }
  }

  private updateOverlay() {
    const $pos = this.editorView.state.doc.resolve(this.cursorPos!);
    const isBlock = !$pos.parent.inlineContent;
    let rect: { left: number; right: number; top: number; bottom: number } | undefined;
    const editorDOM = this.editorView.dom;
    const editorRect = editorDOM.getBoundingClientRect();
    const scaleX = editorRect.width / editorDOM.offsetWidth;
    const scaleY = editorRect.height / editorDOM.offsetHeight;

    if (isBlock) {
      const before = $pos.nodeBefore;
      const after = $pos.nodeAfter;
      if (before || after) {
        const node = this.editorView.nodeDOM(this.cursorPos! - (before ? before.nodeSize : 0));
        if (node) {
          const nodeRect = (node as HTMLElement).getBoundingClientRect();
          let top = before ? nodeRect.bottom : nodeRect.top;
          if (before && after) {
            top =
              (top +
                (this.editorView.nodeDOM(this.cursorPos!) as HTMLElement).getBoundingClientRect()
                  .top) /
              2;
          }
          const halfWidth = (this.width / 2) * scaleY;
          rect = {
            left: nodeRect.left,
            right: nodeRect.right,
            top: top - halfWidth,
            bottom: top + halfWidth,
          };
        }
      }
    }

    if (!rect) {
      const coords = this.editorView.coordsAtPos(this.cursorPos!);
      const halfWidth = (this.width / 2) * scaleX;
      rect = {
        left: coords.left - halfWidth,
        right: coords.left + halfWidth,
        top: coords.top,
        bottom: coords.bottom,
      };
    }

    const parent = this.editorView.dom.offsetParent as HTMLElement;
    if (!this.element) {
      this.element = parent.appendChild(document.createElement('div'));
      if (this.class) this.element.className = this.class;
      this.element.style.cssText = 'position: absolute; z-index: 50; pointer-events: none;';
      if (this.color) {
        this.element.style.backgroundColor = this.color;
      }
    }

    this.element.classList.toggle('prosemirror-dropcursor-block', isBlock);
    this.element.classList.toggle('prosemirror-dropcursor-inline', !isBlock);

    let parentLeft: number;
    let parentTop: number;
    if (!parent || (parent === document.body && getComputedStyle(parent).position === 'static')) {
      parentLeft = -pageXOffset;
      parentTop = -pageYOffset;
    } else {
      const r = parent.getBoundingClientRect();
      const parentScaleX = r.width / parent.offsetWidth;
      const parentScaleY = r.height / parent.offsetHeight;
      parentLeft = r.left - parent.scrollLeft * parentScaleX;
      parentTop = r.top - parent.scrollTop * parentScaleY;
    }

    this.element.style.left = `${(rect.left - parentLeft) / scaleX}px`;
    this.element.style.top = `${(rect.top - parentTop) / scaleY}px`;
    this.element.style.width = `${(rect.right - rect.left) / scaleX}px`;
    this.element.style.height = `${(rect.bottom - rect.top) / scaleY}px`;
  }

  private scheduleRemoval(timeout: number) {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.setCursor(null), timeout);
  }

  dragover(event: DragEvent) {
    if (!this.editorView.editable) return;
    const pos = this.editorView.posAtCoords({ left: event.clientX, top: event.clientY });
    const node = pos && pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
    const disableDropCursor = node && (node.type.spec as Record<string, unknown>).disableDropCursor;
    const disabled =
      typeof disableDropCursor === 'function'
        ? disableDropCursor(this.editorView, pos, event)
        : disableDropCursor;

    if (pos && !disabled) {
      let target = pos.pos;
      if (this.editorView.dragging?.slice) {
        const point = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
        if (point != null) target = point;
      }
      this.setCursor(target);
      this.scheduleRemoval(5000);
    }
  }

  dragend() {
    this.scheduleRemoval(20);
  }

  drop(event: DragEvent) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5050391a-baab-4666-90cd-e84fd838086c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bc5b12'},body:JSON.stringify({sessionId:'bc5b12',location:'safe-dropcursor:drop',message:'drop in SafeDropcursor DOM listener',data:{hasDragging:!!this.editorView.dragging,defaultPrevented:event.defaultPrevented,eventPhase:event.eventPhase},timestamp:Date.now(),hypothesisId:'H6',runId:'iter3'})}).catch(()=>{});
    // #endregion
    this.scheduleRemoval(20);
  }

  dragleave(event: DragEvent) {
    if (!this.editorView.dom.contains((event as DragEvent & { relatedTarget: Node }).relatedTarget)) {
      this.setCursor(null);
    }
  }
}

export const SafeDropcursor = Extension.create<SafeDropcursorOptions>({
  name: 'dropCursor',

  addOptions() {
    return {
      color: 'currentColor',
      width: 1,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        view: editorView => new SafeDropCursorView(editorView, this.options),
      }),
    ];
  },
});
