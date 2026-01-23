/**
 * Markdown to Tiptap JSON Converter
 *
 * AI Agent가 생성한 마크다운 문자열을 Tiptap JSON으로 변환
 *
 * Uses:
 * - marked: 마크다운 → HTML 변환 (완전한 마크다운 문법 지원)
 * - @tiptap/react: HTML → Tiptap JSON 변환
 */

import { marked } from 'marked';
import { generateJSON } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';

/**
 * 마크다운 문자열을 Tiptap JSON으로 변환
 *
 * @param markdown - 마크다운 문자열 또는 이미 변환된 Tiptap JSON 객체
 * @returns Tiptap JSON 형식의 문서
 *
 * @example
 * ```typescript
 * const markdown = "# Hello\n\nThis is **bold** and *italic*.";
 * const tiptapJson = convertMarkdownToTiptapJSON(markdown);
 * ```
 */
export function convertMarkdownToTiptapJSON(markdown: string | any): any {
  // 이미 Tiptap JSON 형식인 경우 그대로 반환
  if (
    typeof markdown === 'object' &&
    markdown?.type === 'doc' &&
    Array.isArray(markdown?.content)
  ) {
    return markdown;
  }

  // 문자열이 아닌 경우 기본 빈 문서 반환
  if (typeof markdown !== 'string') {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  // 빈 문자열인 경우
  if (!markdown.trim()) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  try {
    // Pre-processing: **bold** → <strong> 변환 (CJK 문자와 괄호 문제 해결)
    // marked.js는 CJK 문자 뒤에 나오는 **bold**와 괄호 조합을 파싱하지 못하는 버그가 있음
    // 참고: https://github.com/markedjs/marked/issues/3798, https://github.com/markedjs/marked/issues/2531
    let preprocessed = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 1️⃣ 마크다운 → HTML 변환 (marked 라이브러리 사용)
    const html = marked.parse(preprocessed, {
      gfm: true, // GitHub Flavored Markdown 지원
      breaks: true, // 줄바꿈을 <br>로 변환
    }) as string;

    // 2️⃣ HTML → Tiptap JSON 변환
    // Highlight extension 추가: <mark> 태그를 지원하기 위해
    const tiptapJson = generateJSON(html, [StarterKit, Highlight]);

    return tiptapJson;
  } catch (error) {
    console.error('[convertMarkdownToTiptapJSON] Failed to convert:', error);

    // Fallback: plain text로 처리
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: markdown,
            },
          ],
        },
      ],
    };
  }
}
