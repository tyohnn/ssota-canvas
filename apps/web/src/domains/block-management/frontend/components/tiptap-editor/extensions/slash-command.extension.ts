/**
 * Slash Command Extension
 *
 * Notion-style slash command: type "/" to insert headings, lists, blockquote, code block, etc.
 * Uses @tiptap/suggestion for the suggestion UI.
 */

'use client';

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
  command: (ctx: {
    editor: import('@tiptap/react').Editor;
    range: { from: number; to: number };
  }) => void;
}

const SLASH_ITEMS: SlashCommandItem[] = [
  {
    title: 'Heading 1',
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
];

function filterItems(query: string): SlashCommandItem[] {
  if (!query) return SLASH_ITEMS;
  const q = query.toLowerCase();
  return SLASH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.searchTerms?.some((t) => t.includes(q))
  );
}

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    const { editor } = this;

    let currentProps: SuggestionProps<SlashCommandItem> | null = null;
    let selectedIndex = 0;
    let popup: HTMLDivElement | null = null;
    let listEl: HTMLUListElement | null = null;

    const renderList = () => {
      const el = listEl;
      if (!el || !currentProps) return;
      const items = currentProps.items;
      selectedIndex = Math.max(0, Math.min(selectedIndex, items.length - 1));
      el.innerHTML = '';
      items.forEach((item, i) => {
        const li = document.createElement('li');
        li.textContent = item.title;
        li.style.cssText =
          'padding:6px 12px;cursor:pointer;border-radius:4px;list-style:none;';
        if (i === selectedIndex) {
          li.style.backgroundColor = 'hsl(var(--accent))';
          li.style.color = 'hsl(var(--accent-foreground))';
        }
        li.addEventListener('mouseenter', () => {
          selectedIndex = i;
          renderList();
        });
        li.addEventListener('click', () => {
          currentProps?.command(item);
        });
        el.appendChild(li);
      });
    };

    const positionPopup = () => {
      if (!popup || !currentProps?.clientRect) return;
      const rect = currentProps.clientRect();
      if (rect) {
        popup.style.top = `${rect.bottom + 4}px`;
        popup.style.left = `${rect.left}px`;
      }
    };

    return [
      Suggestion({
        editor,
        char: '/',
        pluginKey: SlashCommandPluginKey,
        startOfLine: true,
        command: ({ editor: ed, range, props }) => {
          (props as SlashCommandItem).command({ editor: ed, range });
        },
        items: ({ query }) => filterItems(query),
        render: () => ({
          onStart: (props: SuggestionProps<SlashCommandItem>) => {
            currentProps = props;
            selectedIndex = 0;
            popup = document.createElement('div');
            popup.style.cssText =
              'position:fixed;z-index:9999;background:hsl(var(--background));border:1px solid hsl(var(--border));border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:180px;max-height:300px;overflow-y:auto;padding:4px 0;';
            listEl = document.createElement('ul');
            listEl.style.cssText = 'margin:0;padding:0;';
            popup.appendChild(listEl);
            document.body.appendChild(popup);
            positionPopup();
            renderList();
          },
          onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
            currentProps = props;
            selectedIndex = 0;
            positionPopup();
            renderList();
          },
          onKeyDown: (ctx: SuggestionKeyDownProps) => {
            if (!currentProps) return false;
            const items = currentProps.items;
            if (ctx.event.key === 'ArrowDown') {
              selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
              renderList();
              return true;
            }
            if (ctx.event.key === 'ArrowUp') {
              selectedIndex = Math.max(selectedIndex - 1, 0);
              renderList();
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
            currentProps = null;
          },
        }),
      }),
    ];
  },
});
