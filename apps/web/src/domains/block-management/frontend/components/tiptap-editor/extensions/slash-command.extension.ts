/**
 * Slash Command Extension
 *
 * Notion-style slash command: type "/" to insert headings, lists, blockquote, code block, etc.
 * Uses @tiptap/suggestion for the suggestion UI.
 */

'use client';

import {
  AlertOctagon,
  AlertTriangle,
  ChevronsDownUp,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Lightbulb,
  List,
  ListOrdered,
  Minus,
  Quote,
  Sigma,
  SquareCheckBig,
  StickyNote,
  Table,
} from 'lucide-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from '@tiptap/suggestion';

export const SlashCommandPluginKey = new PluginKey('slashCommand');

export interface SlashCommandItem {
  title: string;
  description?: string;
  searchTerms?: string[];
  icon?: string;
  command: (ctx: {
    editor: import('@tiptap/react').Editor;
    range: { from: number; to: number };
  }) => void;
}

function iconSvg(Icon: React.ComponentType<{ size?: number; className?: string }>): string {
  return renderToStaticMarkup(
    createElement(Icon, { size: 16, className: 'shrink-0' })
  ) as string;
}

export interface SlashCommandOptions {
  uploadImage?: (file: File) => Promise<string>;
  openMathEditor?: (state: { pos: number; latex: string; nodeType: 'blockMath' | 'inlineMath' }) => void;
  /** Called when slash suggestion menu opens. Use to close other overlays (e.g. math popover) to avoid conflicts. */
  onSuggestionStart?: () => void;
}

function createSlashItems(options: SlashCommandOptions): SlashCommandItem[] {
  const { uploadImage, openMathEditor } = options;
  const items: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    icon: iconSvg(Heading1),
    description: 'Big section heading',
    searchTerms: ['title', 'h1', 'big'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run();
    },
  },
  {
    title: 'Heading 2',
    icon: iconSvg(Heading2),
    description: 'Medium section heading',
    searchTerms: ['subtitle', 'h2'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run();
    },
  },
  {
    title: 'Heading 3',
    icon: iconSvg(Heading3),
    description: 'Small section heading',
    searchTerms: ['h3'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run();
    },
  },
  {
    title: 'Bullet List',
    icon: iconSvg(List),
    description: 'Create a bulleted list',
    searchTerms: ['ul', 'list'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleBulletList()
        .run();
    },
  },
  {
    title: 'Numbered List',
    icon: iconSvg(ListOrdered),
    description: 'Create a numbered list',
    searchTerms: ['ol', 'list'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleOrderedList()
        .run();
    },
  },
  {
    title: 'Quote',
    icon: iconSvg(Quote),
    description: 'Insert a blockquote',
    searchTerms: ['blockquote'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleBlockquote()
        .run();
    },
  },
  {
    title: 'Code Block',
    icon: iconSvg(Code),
    description: 'Insert a code block',
    searchTerms: ['code', 'pre'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleCodeBlock()
        .run();
    },
  },
  {
    title: 'Divider',
    icon: iconSvg(Minus),
    description: 'Insert a horizontal rule',
    searchTerms: ['hr', 'line', 'separator'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setHorizontalRule()
        .run();
    },
  },
    ...(uploadImage
      ? [
          {
            title: 'Image',
            icon: iconSvg(Image),
            description: 'Upload an image',
            searchTerms: ['image', 'img', 'picture'],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file || !uploadImage) return;
                try {
                  const url = await uploadImage(file);
                  editor.chain().focus().setImage({ src: url }).run();
                } catch (err) {
                  console.warn('[Slash] Image upload failed:', err);
                }
              };
              input.click();
            },
          } as SlashCommandItem,
        ]
      : []),
  {
    title: 'Table',
    icon: iconSvg(Table),
    description: 'Insert a 3x3 table',
    searchTerms: ['table', 'grid'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3 })
        .run();
    },
  },
  {
    title: 'Task List',
    icon: iconSvg(SquareCheckBig),
    description: 'Create a task list',
    searchTerms: ['task', 'todo', 'checkbox'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleTaskList()
        .run();
    },
  },
  {
    title: 'Toggle',
    icon: iconSvg(ChevronsDownUp),
    description: 'Collapsible section',
    searchTerms: ['toggle', 'details', 'collapse'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setDetails()
        .run();
    },
  },
  {
    title: 'LaTeX',
    icon: iconSvg(Sigma),
    description: 'Insert math formula',
    searchTerms: ['latex', 'math', 'formula'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const { state, dispatch } = editor.view;
      const blockMathType = state.schema.nodes.blockMath;
      if (blockMathType) {
        const node = blockMathType.create({ latex: '' });
        const tr = state.tr.replaceSelectionWith(node);
        dispatch(tr);
      }
    },
  },
  {
    title: 'Callout Note',
    icon: iconSvg(StickyNote),
    description: 'Insert a note callout',
    searchTerms: ['callout', 'note'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setAdmonition({ type: 'note' })
        .run();
    },
  },
  {
    title: 'Callout Warning',
    icon: iconSvg(AlertTriangle),
    description: 'Insert a warning callout',
    searchTerms: ['warning'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setAdmonition({ type: 'warning' })
        .run();
    },
  },
  {
    title: 'Callout Tip',
    icon: iconSvg(Lightbulb),
    description: 'Insert a tip callout',
    searchTerms: ['tip'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setAdmonition({ type: 'tip' })
        .run();
    },
  },
  {
    title: 'Callout Danger',
    icon: iconSvg(AlertOctagon),
    description: 'Insert a danger callout',
    searchTerms: ['danger'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setAdmonition({ type: 'danger' })
        .run();
    },
  },
  ];
  return items;
}

function filterItems(
  query: string,
  items: SlashCommandItem[]
): SlashCommandItem[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.searchTerms?.some((t) => t.includes(q))
  );
}

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      uploadImage: undefined as ((file: File) => Promise<string>) | undefined,
      openMathEditor: undefined as
        | ((state: { pos: number; latex: string; nodeType: 'blockMath' | 'inlineMath' }) => void)
        | undefined,
      onSuggestionStart: undefined as (() => void) | undefined,
    };
  },

  addProseMirrorPlugins() {
    const { editor, options } = this;
    const slashItems = createSlashItems({
      uploadImage: options.uploadImage,
      openMathEditor: options.openMathEditor,
    });

    let currentProps: SuggestionProps<SlashCommandItem> | null = null;
    let selectedIndex = 0;
    let popup: HTMLDivElement | null = null;
    let listEl: HTMLUListElement | null = null;

    function css(name: string) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    // DOM 노드 참조: 선택 스타일만 갱신할 때 full rebuild를 피하기 위해 유지.
    // renderList()의 innerHTML=''은 모든 <li>를 제거하므로, 마우스 호버 중 rebuild 시
    // 새 <li>가 마우스 아래 생성 → mouseenter 반복 발화 → 무한 루프가 발생했음.
    let listItemEls: HTMLLIElement[] = [];
    // 직전에 렌더한 items 배열 참조. 동일하면 full rebuild를 건너뛰고 updateSelection만 호출.
    // onExit에서 []로 초기화하지 않으면, 다음 슬래시 시 items===lastRenderedItems가 되어
    // rebuild를 스킵하는데 listItemEls는 이미 비어있어서 빈 메뉴가 표시되는 버그가 발생.
    let lastRenderedItems: SlashCommandItem[] = [];

    /** 선택 하이라이트만 갱신. DOM을 재생성하지 않아 mouseenter 루프와 클릭 손실을 방지. */
    const updateSelection = () => {
      const accent = css('--accent');
      const accentFg = css('--accent-foreground');
      const bg = css('--background');
      const fg = css('--foreground');
      listItemEls.forEach((li, i) => {
        const isSelected = i === selectedIndex;
        li.style.background = isSelected ? accent : bg;
        li.style.color = isSelected ? accentFg : fg;
      });
      // 방향키로 이동 시 선택된 항목이 보이도록 스크롤
      const selectedEl = listItemEls[selectedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    };

    const renderList = () => {
      const el = listEl;
      if (!el || !currentProps) return;
      const items = currentProps.items;
      selectedIndex = Math.max(0, Math.min(selectedIndex, items.length - 1));

      // 아이템이 바뀌지 않았으면 DOM rebuild 없이 스타일만 갱신.
      // suggestion 플러그인이 onUpdate를 자주 호출해도 불필요한 rebuild를 막음.
      if (items === lastRenderedItems && listItemEls.length === items.length) {
        updateSelection();
        return;
      }

      lastRenderedItems = items;
      const bg = css('--background');
      const fg = css('--foreground');
      const accent = css('--accent');
      const accentFg = css('--accent-foreground');

      el.innerHTML = '';
      listItemEls = [];
      items.forEach((item, i) => {
        const li = document.createElement('li');
        const isSelected = i === selectedIndex;
        li.style.cssText = `display:flex;align-items:center;gap:10px;padding:6px 12px;cursor:pointer;border-radius:4px;list-style:none;font-size:14px;background:${isSelected ? accent : bg};color:${isSelected ? accentFg : fg};`;
        if (item.icon) {
          const iconWrap = document.createElement('span');
          iconWrap.innerHTML = item.icon;
          iconWrap.style.cssText = 'display:flex;align-items:center;opacity:0.7;';
          li.appendChild(iconWrap);
        }
        const text = document.createElement('span');
        text.textContent = item.title;
        li.appendChild(text);
        li.addEventListener('mouseenter', () => {
          if (selectedIndex === i) return; // 불필요한 업데이트 방지
          selectedIndex = i;
          updateSelection(); // renderList() 호출 시 DOM 재생성으로 mouseenter 루프 유발
        });
        li.addEventListener('click', () => {
          currentProps?.command(item);
        });
        listItemEls.push(li);
        el.appendChild(li);
      });
    };

    const VIEWPORT_MARGIN = 8;

    const positionPopup = () => {
      if (!popup || !currentProps?.clientRect) return;
      const rect = currentProps.clientRect();
      if (!rect) return;

      const gap = 4;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popupRect = popup.getBoundingClientRect();
      const popupWidth = popupRect.width;
      const popupHeight = popupRect.height;

      const spaceBelow = viewportHeight - VIEWPORT_MARGIN - rect.bottom;
      const spaceAbove = rect.top - VIEWPORT_MARGIN;

      // 세로: 아래 공간 부족하고 위가 더 넓으면 위로 표시
      const showAbove =
        spaceBelow < popupHeight + gap && spaceAbove > spaceBelow;

      if (showAbove) {
        popup.style.top = `${rect.top - popupHeight - gap}px`;
      } else {
        popup.style.top = `${rect.bottom + gap}px`;
      }

      // 가로: 오른쪽으로 넘치면 왼쪽 정렬, 왼쪽으로 넘치면 오른쪽 정렬
      let left = rect.left;
      if (left + popupWidth > viewportWidth - VIEWPORT_MARGIN) {
        left = Math.max(VIEWPORT_MARGIN, viewportWidth - popupWidth - VIEWPORT_MARGIN);
      }
      if (left < VIEWPORT_MARGIN) {
        left = VIEWPORT_MARGIN;
      }
      popup.style.left = `${left}px`;
    };

    return [
      Suggestion({
        editor,
        char: '/',
        pluginKey: SlashCommandPluginKey,
        startOfLine: true,
        decorationClass: 'slash-command-trigger',
        decorationEmptyClass: 'slash-command-trigger-empty',
        command: ({ editor: ed, range, props }) => {
          (props as SlashCommandItem).command({ editor: ed, range });
        },
        items: ({ query }) => filterItems(query, slashItems),
        render: () => ({
          onStart: (props: SuggestionProps<SlashCommandItem>) => {
            options.onSuggestionStart?.();
            // Popover unmount 시 포커스가 빠져나가면 slash 키 이벤트가 에디터에 도달하지 않음.
            // React 업데이트/언마운트 이후 에디터로 포커스 복원.
            requestAnimationFrame(() => editor.commands.focus());
            currentProps = props;
            selectedIndex = 0;

            const bg = css('--background');
            const border = css('--border');

            popup = document.createElement('div');
            popup.style.cssText = `position:fixed;z-index:9999;background:${bg};border:1px solid ${border};border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:200px;max-height:300px;overflow-y:auto;padding:4px 0;`;
            // Capture-phase preventDefault on ALL mousedown inside popup
            // prevents editor blur so the suggestion stays active for click
            popup.addEventListener('mousedown', (e) => e.preventDefault(), true);
            listEl = document.createElement('ul');
            listEl.style.cssText = 'margin:0;padding:0;';
            popup.appendChild(listEl);
            document.body.appendChild(popup);
            renderList();
            requestAnimationFrame(() => {
              positionPopup();
            });
          },
          onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
            // 아이템이 실제로 바뀔 때만(필터 입력 시) selectedIndex 초기화.
            // 그 외 onUpdate 호출 시 기존 선택 유지.
            const itemsChanged = props.items !== currentProps?.items;
            currentProps = props;
            if (itemsChanged) selectedIndex = 0;
            renderList();
            requestAnimationFrame(() => {
              positionPopup();
            });
          },
          onKeyDown: (ctx: SuggestionKeyDownProps) => {
            if (!currentProps) return false;
            const items = currentProps.items;
            if (ctx.event.key === 'ArrowDown') {
              selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
              updateSelection(); // DOM rebuild 없이 하이라이트만 변경
              return true;
            }
            if (ctx.event.key === 'ArrowUp') {
              selectedIndex = Math.max(selectedIndex - 1, 0);
              updateSelection();
              return true;
            }
            if (ctx.event.key === 'Enter') {
              const item = items[selectedIndex];
              if (item) {
                currentProps.command(item);
                return true;
              }
            }
            return false;
          },
          onExit: () => {
            popup?.remove();
            popup = null;
            listEl = null;
            listItemEls = [];
            lastRenderedItems = []; // 다음 onStart에서 full rebuild가 실행되도록 필수
            currentProps = null;
          },
        }),
      }),
    ];
  },
});
