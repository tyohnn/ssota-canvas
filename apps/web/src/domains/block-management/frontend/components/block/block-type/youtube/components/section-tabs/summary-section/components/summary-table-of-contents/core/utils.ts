/**
 * Summary Table of Contents Utils
 *
 * 헤더 기반 목차 유틸리티 함수들
 */

import type { JSONContent } from '@tiptap/core';

/**
 * Summary Table of Contents Item
 */
export interface SummaryTOCItem {
  id: string; // 고유 ID (헤더 텍스트 기반)
  level: 1 | 2 | 3; // 헤더 레벨 (h1, h2, h3)
  text: string; // 헤더 텍스트
  elementId?: string; // DOM element ID (스크롤용)
}

/**
 * TipTap JSON에서 헤더 추출
 *
 * @param json - TipTap JSON 콘텐츠
 * @returns 헤더 목록 (h1, h2, h3만)
 */
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
      // h1, h2, h3만 추출
      if (level >= 1 && level <= 3) {
        // 헤더 텍스트 추출
        const text = extractTextFromNode(node);
        if (text.trim()) {
          // ID 생성 (텍스트 기반, URL-safe)
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

    // 재귀적으로 자식 노드 탐색
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  json.content.forEach(traverse);

  return headings;
}

/**
 * 노드에서 텍스트 추출
 */
function extractTextFromNode(node: JSONContent): string {
  if (node.type === 'text') {
    return node.text || '';
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join('');
  }

  return '';
}
