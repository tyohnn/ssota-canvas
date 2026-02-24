/**
 * Server-safe Admonition extension for ProseMirror schema.
 *
 * Minimal NodeSpec only—no markdown tokenizer, no frontend imports.
 */
import { Node } from '@tiptap/core';

export const AdmonitionServerSafe = Node.create({
  name: 'admonition',
  group: 'block',
  content: 'block+',
  addAttributes() {
    return {
      type: { default: 'note' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-admonition]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-admonition': '', ...HTMLAttributes }, 0];
  },
});
