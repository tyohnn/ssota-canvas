/**
 * Tiptap JSON utilities—server-safe, no Tiptap extension imports.
 *
 * Used by apply-block-content-steps.service. Must NOT import from
 * tiptap-markdown.utils or any file that loads @tiptap/extension-image.
 */

/** Minimal type for Tiptap JSON node (avoids @tiptap/core import) */
type JsonNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: JsonNode[];
};

/**
 * Extract plain text from Tiptap JSON content.
 */
export function extractPlainText(json: JsonNode | null | undefined): string {
  if (!json) return '';

  function traverse(node: JsonNode): string {
    if (node.type === 'text') {
      return node.text || '';
    }

    if (node.content) {
      const separator =
        node.type === 'paragraph' ||
        node.type === 'heading' ||
        node.type === 'blockquote' ||
        node.type === 'admonition' ||
        node.type === 'details' ||
        node.type === 'detailsContent'
          ? '\n\n'
          : node.type === 'listItem' || node.type === 'taskItem'
            ? '\n'
            : node.type === 'tableRow' || node.type === 'tableCell'
              ? ' '
              : ' ';
      return node.content.map(traverse).join(separator);
    }

    if (node.type === 'blockMath' || node.type === 'inlineMath') {
      return (node.attrs?.latex as string) || '';
    }

    return '';
  }

  return traverse(json).trim();
}

/** Empty Tiptap document structure */
export const EMPTY_TIPTAP_DOC: JsonNode = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};
