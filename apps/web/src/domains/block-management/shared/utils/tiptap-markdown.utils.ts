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

import { generateHTML, generateJSON, getSchema } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Code from '@tiptap/extension-code';
import { Markdown } from '@tiptap/markdown';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { TableKit } from '@tiptap/extension-table';
import { ImageServerSafe } from './image-server.extension';
import { Mathematics } from '@tiptap/extension-mathematics';
import {
  Details,
  DetailsSummary,
  DetailsContent,
} from '@tiptap/extension-details';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

import { DOMParser } from '@tiptap/pm/model';
import { parseHTML } from 'linkedom';

import { AdmonitionServerSafe } from './admonition-server.extension';

/**
 * Mathematics 제외한 기본 확장 목록
 *
 * 클라이언트 useTipTapEditor에서 Mathematics를 onClick 핸들러와 함께 별도 추가할 때 사용.
 */
// excludes: '' → Bold, Italic, TextStyle(Color) 등 다른 마크와 공존 가능하도록 배제 목록 비움
const CodeAllowOtherMarks = Code.extend({ excludes: '' });

export const BASE_EXTENSIONS_WITHOUT_MATH = [
  StarterKit.configure({
    dropcursor: false,
    code: false,
  }),
  CodeAllowOtherMarks,
  ImageServerSafe,
  TableKit,
  Details,
  DetailsSummary,
  DetailsContent,
  TaskList,
  TaskItem,
  AdmonitionServerSafe,
];

/**
 * 서버 사이드 안전한 ProseMirror 스키마용 확장 목록
 *
 * - SafeDropcursor, Markdown 제외 (스키마에 노드/마크를 추가하지 않음)
 * - getSchema()로 pmSchema 생성 시 사용
 * - apply-block-content-steps.service.ts의 pmSchema 기반
 *
 * 포함 노드 타입:
 * - StarterKit 기본 (paragraph, heading, bold, etc.)
 * - image, table/tableRow/tableCell/tableHeader
 * - blockMath, inlineMath
 * - details, detailsSummary, detailsContent
 * - taskList, taskItem
 * - admonition
 */
export const SCHEMA_EXTENSIONS = [
  ...BASE_EXTENSIONS_WITHOUT_MATH,
  Mathematics.configure({ katexOptions: { throwOnError: false } }),
];

/**
 * 클라이언트 에디터용 확장 목록
 *
 * Image: use-tiptap-editor.ts에서 @tiptap/extension-image 직접 추가 (setImage 등 클라이언트 전용)
 * Admonition: use-tiptap-editor.ts에서 프론트엔드 전체 확장 추가 (setAdmonition 등)
 * SafeDropcursor: use-tiptap-editor.ts에서 별도 추가
 * Markdown: Tiptap JSON ↔ Markdown 양방향 변환
 */
export const MARKDOWN_EXTENSIONS = [
  ...BASE_EXTENSIONS_WITHOUT_MATH,
  Mathematics.configure({ katexOptions: { throwOnError: false } }),
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
    const html = generateHTML(json, MARKDOWN_EXTENSIONS);

    // 2. HTML → Markdown (turndown 사용)
    const turndownService = new TurndownService({
      headingStyle: 'atx', // # 스타일
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced', // ``` 스타일
      emDelimiter: '*', // *italic*
      strongDelimiter: '**', // **bold**
    });

    // Admonition: div[data-admonition] → :::type ... :::
    turndownService.addRule('admonition', {
      filter: (node) =>
        node.nodeName === 'DIV' &&
        node.getAttribute?.('data-admonition') !== null,
      replacement: (content, node) => {
        const type = (node as Element).getAttribute('data-type') || 'note';
        return `:::${type}\n${content}\n:::\n\n`;
      },
    });

    // Task list: ul[data-type="task-list"] → - [ ] / - [x]
    turndownService.addRule('taskList', {
      filter: (node) =>
        node.nodeName === 'UL' &&
        (node as Element).getAttribute?.('data-type') === 'task-list',
      replacement: (content) => content,
    });
    turndownService.addRule('taskItem', {
      filter: (node) =>
        node.nodeName === 'LI' &&
        (node as Element).getAttribute?.('data-type') === 'task-item',
      replacement: (content, node) => {
        const checked = (node as Element).getAttribute('data-checked') === 'true';
        const prefix = checked ? '- [x] ' : '- [ ] ';
        return prefix + content.replace(/\n/g, '\n    ');
      },
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
/**
 * :::type ... ::: 를 HTML로 변환 (marked가 인식하도록)
 */
function preprocessAdmonition(md: string): string {
  const validTypes = ['note', 'warning', 'tip', 'danger'];
  return md.replace(/^:::(\w+)\n([\s\S]*?)\n:::\n?/gm, (_, type, content) => {
    const safeType = validTypes.includes(type) ? type : 'note';
    const innerHtml = marked.parse(content.trim(), {
      gfm: true,
      breaks: true,
    }) as string;
    return `<div data-admonition data-type="${safeType}">${innerHtml}</div>`;
  });
}

/**
 * Node.js에서 linkedom + ProseMirror DOMParser로 HTML→JSON 변환
 * TipTap generateJSON은 elementFromString에서 window를 요구해 Node에서 실패함.
 * ProseMirror DOMParser는 DOM 노드를 순회만 하므로 linkedom 노드로 동작함.
 */
function htmlToTiptapJsonServer(html: string): JSONContent {
  if (typeof window !== 'undefined') {
    return generateJSON(html, BASE_EXTENSIONS_WITHOUT_MATH);
  }
  const { document: doc } = parseHTML(
    '<!DOCTYPE html><html><body></body></html>'
  );
  const div = doc.createElement('div');
  div.innerHTML = html;
  const schema = getSchema(BASE_EXTENSIONS_WITHOUT_MATH);
  const parser = DOMParser.fromSchema(schema);
  const pmDoc = parser.parse(div);
  return pmDoc.toJSON() as JSONContent;
}

/**
 * Markdown → TipTap JSON (서버 전용)
 *
 * Welcome 페이지 시딩 등 서버에서 실행 시 사용.
 * Node.js에서는 linkedom으로 DOM 폴리필 후 generateJSON 호출.
 */
export function markdownToTiptapServerSafe(markdown: string): JSONContent {
  try {
    if (!markdown || markdown.trim() === '') {
      return EMPTY_TIPTAP_DOC;
    }
    // Preprocessing: **bold** → <strong> (CJK/괄호 조합 시 marked 파싱 이슈 회피)
    let preprocessed = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    preprocessed = preprocessAdmonition(preprocessed);
    const html = marked.parse(preprocessed, { gfm: true, breaks: true }) as string;
    const json = htmlToTiptapJsonServer(html);
    return json;
  } catch (error: unknown) {
    console.error('[markdownToTiptapServerSafe] Parsing error:', error);
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

export function markdownToTiptap(markdown: string): JSONContent {
  try {
    if (!markdown || markdown.trim() === '') {
      return EMPTY_TIPTAP_DOC;
    }

    // Preprocessing: **bold** → <strong> (CJK/괄호 조합 시 marked 파싱 이슈 회피)
    let preprocessed = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Admonition :::type ... ::: → HTML
    preprocessed = preprocessAdmonition(preprocessed);

    const html = marked.parse(preprocessed, {
      gfm: true,
      breaks: true,
    }) as string;

    const json = generateJSON(html, MARKDOWN_EXTENSIONS);

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

    // blockMath, inlineMath: attrs.latex fallback
    if (node.type === 'blockMath' || node.type === 'inlineMath') {
      return (node.attrs?.latex as string) || '';
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
