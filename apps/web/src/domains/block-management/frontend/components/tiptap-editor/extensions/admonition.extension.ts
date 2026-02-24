/**
 * Admonition (Callout) Extension
 *
 * Note, Warning, Tip, Danger 타입의 블록.
 * :::type ... ::: 마크다운 문법 지원.
 */
import { Node } from '@tiptap/core';

const ADMONITION_TYPES = ['note', 'warning', 'tip', 'danger'] as const;
export type AdmonitionType = (typeof ADMONITION_TYPES)[number];

function isValidType(type: string): type is AdmonitionType {
  return ADMONITION_TYPES.includes(type as AdmonitionType);
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    admonition: {
      setAdmonition: (attrs: { type?: AdmonitionType }) => ReturnType;
    };
  }
}

export const Admonition = Node.create({
  name: 'admonition',

  group: 'block',
  content: 'block+',

  addAttributes() {
    return {
      type: {
        default: 'note',
        parseHTML: (element) => {
          const t = element.getAttribute('data-type');
          return t && isValidType(t) ? t : 'note';
        },
        renderHTML: (attributes) => ({
          'data-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-admonition]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-admonition': '', ...HTMLAttributes }, 0];
  },

  addCommands() {
    return {
      setAdmonition:
        (attrs: { type?: AdmonitionType }) =>
        ({ commands }) => {
          const type = attrs?.type && isValidType(attrs.type) ? attrs.type : 'note';
          return commands.insertContent({
            type: 'admonition',
            attrs: { type },
            content: [
              {
                type: 'paragraph',
                content: [],
              },
            ],
          }) as boolean;
        },
    };
  },

  markdownTokenizer: {
    name: 'admonition',
    level: 'block',

    start: (src: string) => src.indexOf(':::'),

    tokenize: (src, _tokens, lexer) => {
      const match = /^:::(\w+)\n([\s\S]*?)\n:::\n?/.exec(src);
      if (!match) return undefined;

      const rawType = match[1] ?? '';
      const admonitionType = isValidType(rawType) ? (rawType as AdmonitionType) : 'note';
      const innerText = match[2] ?? '';

      return {
        type: 'admonition',
        raw: match[0],
        admonitionType,
        text: innerText,
        tokens: lexer.blockTokens(innerText),
      };
    },
  },

  parseMarkdown: (token: any, helpers: any) => {
    const type =
      token.admonitionType && isValidType(token.admonitionType)
        ? (token.admonitionType as AdmonitionType)
        : 'note';
    const childTokens = (token.tokens ?? []) as object[];
    return {
      type: 'admonition',
      attrs: { type },
      content: helpers.parseChildren(childTokens),
    };
  },

  renderMarkdown: (node, helpers) => {
    const type =
      node.attrs?.type && isValidType(node.attrs.type as string)
        ? (node.attrs.type as AdmonitionType)
        : 'note';
    const content = helpers.renderChildren(node.content ?? []);
    return `:::${type}\n${content}\n:::\n\n`;
  },
});
