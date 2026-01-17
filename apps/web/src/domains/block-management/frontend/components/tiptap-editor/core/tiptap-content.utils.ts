/**
 * Tiptap Content Utilities
 *
 * Tiptap JSON content를 조작하는 유틸리티 함수들
 */
import type { JSONContent } from '@tiptap/core';

/**
 * 텍스트를 quote 블록으로 변환
 * @param text - 인용할 텍스트
 * @param source - 소스 정보 (YouTube 제목과 타임스탬프)
 * @returns Tiptap blockquote JSON 구조
 */
export function createQuoteBlock(
  text: string,
  source?: { title: string; timestamp: string }
): JSONContent {
  const content: JSONContent[] = [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: text,
        },
      ],
    },
  ];

  // 소스 정보가 있으면 마지막에 추가
  if (source) {
    content.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `— ${source.title} [${source.timestamp}]`,
          marks: [
            {
              type: 'italic',
            },
          ],
        },
      ],
    });
  }

  return {
    type: 'blockquote',
    content,
  };
}

/**
 * 기존 Tiptap JSON content 끝에 새 노드 추가
 * @param currentContent - 현재 Tiptap JSON content (또는 null/undefined)
 * @param newNode - 추가할 새 노드
 * @returns 업데이트된 Tiptap JSON content
 */
export function appendToTiptapContent(
  currentContent: JSONContent | null | undefined,
  newNode: JSONContent
): JSONContent {
  // content가 없거나 유효하지 않은 경우 새 doc으로 초기화
  if (!currentContent || currentContent.type !== 'doc') {
    return {
      type: 'doc',
      content: [newNode],
    };
  }

  // content 배열이 없는 경우 초기화
  if (!currentContent.content) {
    return {
      ...currentContent,
      content: [newNode],
    };
  }

  return {
    ...currentContent,
    content: [...currentContent.content, newNode],
  };
}
