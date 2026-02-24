/**
 * Server-safe Image extension for ProseMirror schema.
 *
 * @tiptap/extension-image uses React/NodeView and triggers Next.js
 * "Cannot access src on the server" (temporary client reference) when
 * step.apply() runs on the server. This minimal extension provides
 * only the NodeSpec with plain attrs—no DOM/React—for use in
 * SCHEMA_EXTENSIONS when building pmSchema for server-side step application.
 */
import { Node } from '@tiptap/core';

export const ImageServerSafe = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'img[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes];
  },
});
