/**
 * Markdown Content Section Hook
 *
 * Editor Panel의 Markdown Content Section 로직 관리
 * 공통 useBlockNoteTiptap 사용
 */

'use client';

import { useBlockNoteTiptap } from '@/domains/block-management/frontend/hooks/block-property/use-block-note-tiptap';

import type {
  UseMarkdownContentSectionOptions,
  UseMarkdownContentSectionReturn,
} from './types';

/**
 * Markdown Content Section Hook
 *
 * Editor Panel에서 블록 콘텐츠를 편집하는 로직 관리
 */
export function useMarkdownContentSection(
  options: UseMarkdownContentSectionOptions
): UseMarkdownContentSectionReturn {
  const { blockData, dependencies, readonly = false } = options;
  const { reactFlow, contentVersionRef } = dependencies;

  const { editor, handleEditorClick, mathEditing, setMathEditing } = useBlockNoteTiptap({
    blockData,
    reactFlow,
    editable: !readonly,
    placeholder: 'Click to add note...',
    contentVersionRef,
  });

  return {
    editor,
    handleEditorClick,
    mathEditing,
    setMathEditing,
  };
}
