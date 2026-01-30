/**
 * Tiptap ↔ Markdown 변환 유틸리티
 *
 * 서버 사이드 안전한 변환:
 * - generateHTML: Tiptap JSON → HTML (서버 사이드 안전)
 * - turndown: HTML → Markdown
 * - markdownToTiptap: marked로 Markdown → HTML 후 generateJSON (HTML 기대)
 *
 * @module tiptap-markdown.utils
 */

import { generateHTML, generateJSON } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import TurndownService from 'turndown';
import { marked } from 'marked';

/**
 * Tiptap에서 사용할 확장 목록 (단일 정의)
 *
 * StarterKit 포함:
 * - Document, Paragraph, Text
 * - Heading (h1-h6)
 * - Bold, Italic, Strike
 * - Code, CodeBlock
 * - Blockquote
 * - BulletList, OrderedList, ListItem
 * - HorizontalRule, HardBreak
 *
 * Markdown 확장:
 * - Tiptap JSON ↔ Markdown 양방향 변환
 */
export const MARKDOWN_EXTENSIONS = [
  StarterKit,
  Markdown.configure({
    markedOptions: {
      gfm: true,
      breaks: true,
      pedantic: false,
    },
  }),
];

/**
 * Tiptap JSON → Markdown 변환 (서버 사이드 안전)
 *
 * generateHTML (서버 사이드 안전) → turndown (HTML → Markdown)
 * - DOM/window 객체 불필요
 * - Next.js 서버 컴포넌트에서 안전하게 실행 가능
 *
 * @param json - Tiptap JSON 콘텐츠
 * @returns Markdown 문자열
 *
 * @example
 * ```typescript
 * const json = {
 *   type: 'doc',
 *   content: [
 *     {
 *       type: 'heading',
 *       attrs: { level: 1 },
 *       content: [{ type: 'text', text: 'Title' }]
 *     }
 *   ]
 * };
 *
 * const markdown = tiptapToMarkdown(json);
 * // '# Title'
 * ```
 */
export function tiptapToMarkdown(json: JSONContent): string {
  try {
    if (!json || !json.content || json.content.length === 0) {
      return '';
    }

    // 서버(SSR/Node)에서는 generateHTML이 window를 참조해 에러가 나므로, 순수 텍스트만 반환
    if (typeof window === 'undefined') {
      return extractPlainText(json);
    }

    // 1. Tiptap JSON → HTML (브라우저에서만)
    const html = generateHTML(json, [StarterKit]);

    // 2. HTML → Markdown (turndown 사용)
    const turndownService = new TurndownService({
      headingStyle: 'atx', // # 스타일
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced', // ``` 스타일
      emDelimiter: '*', // *italic*
      strongDelimiter: '**', // **bold**
    });

    const markdown = turndownService.turndown(html);

    return markdown.trim();
  } catch (error) {
    console.error('[tiptapToMarkdown] Conversion error:', error);
    return extractPlainText(json);
  }
}

/**
 * Markdown → Tiptap JSON 변환
 *
 * generateJSON는 HTML 입력을 기대함. Markdown을 넘기면 파싱 실패 → 단일 <p> fallback.
 * 따라서 marked로 Markdown → HTML 후 generateJSON(html) 사용.
 *
 * @param markdown - Markdown 문자열
 * @returns Tiptap JSON 콘텐츠
 *
 * @example
 * ```typescript
 * const markdown = '# Title\n\nParagraph with **bold** text.';
 * const json = markdownToTiptap(markdown);
 * ```
 */
export function markdownToTiptap(markdown: string): JSONContent {
  try {
    if (!markdown || markdown.trim() === '') {
      return EMPTY_TIPTAP_DOC;
    }

    // Preprocessing: **bold** → <strong> (CJK/괄호 조합 시 marked 파싱 이슈 회피)
    const preprocessed = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const html = marked.parse(preprocessed, {
      gfm: true,
      breaks: true,
    }) as string;

    const json = generateJSON(html, [StarterKit]);

    return json;
  } catch (error) {
    console.error('[markdownToTiptap] Parsing error:', error);

    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: markdown }],
        },
      ],
    };
  }
}

/**
 * Tiptap JSON에서 순수 텍스트 추출 (Fallback용)
 *
 * @param json - Tiptap JSON 콘텐츠
 * @returns 순수 텍스트
 */
export function extractPlainText(json: JSONContent): string {
  if (!json) return '';

  function traverse(node: JSONContent): string {
    if (node.type === 'text') {
      return node.text || '';
    }

    if (node.content) {
      const separator =
        node.type === 'paragraph'
          ? '\n\n'
          : node.type === 'heading'
            ? '\n\n'
            : node.type === 'listItem'
              ? '\n'
              : ' ';
      return node.content.map(traverse).join(separator);
    }

    return '';
  }

  return traverse(json).trim();
}

/**
 * 빈 Markdown인지 확인
 *
 * @param markdown - 확인할 Markdown 문자열
 * @returns 빈 문자열이면 true
 */
export function isEmptyMarkdown(markdown: string): boolean {
  return !markdown || markdown.trim() === '';
}

/**
 * 기본 빈 Markdown
 */
export const EMPTY_MARKDOWN = '';

/**
 * 기본 빈 Tiptap 문서
 */
export const EMPTY_TIPTAP_DOC: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};
