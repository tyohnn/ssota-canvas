/**
 * Summary Table of Contents Utils
 */

import type { JSONContent } from '@tiptap/core';

export interface SummaryTOCItem {
  id: string;
  level: 1 | 2 | 3;
  text: string;
  elementId?: string;
}

export function extractHeadingsFromTiptapJSON(
  json: JSONContent | null | undefined
): SummaryTOCItem[] {
  if (!json || !json.content || !Array.isArray(json.content)) {
    return [];
  }

  const headings: SummaryTOCItem[] = [];
  let index = 0;

  function traverse(node: JSONContent) {
    if (node.type === 'heading') {
      const level = (node.attrs?.level as number) || 1;
      if (level >= 1 && level <= 3) {
        const text = extractTextFromNode(node);
        if (text.trim()) {
          const id = `heading-${index}-${text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')}`;

          headings.push({
            id,
            level: level as 1 | 2 | 3,
            text: text.trim(),
            elementId: id,
          });
          index++;
        }
      }
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  json.content.forEach(traverse);

  return headings;
}

function extractTextFromNode(node: JSONContent): string {
  if (node.type === 'text') {
    return node.text || '';
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join('');
  }

  return '';
}
