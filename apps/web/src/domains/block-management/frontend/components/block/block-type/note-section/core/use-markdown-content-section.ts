/**
 * Markdown Content Section Hook
 */

'use client';

import { useBlockNoteTiptap } from '@/domains/block-management/frontend/hooks/block-property/use-block-note-tiptap';

import type {
  UseMarkdownContentSectionOptions,
  UseMarkdownContentSectionReturn,
} from './types';

export function useMarkdownContentSection(
  options: UseMarkdownContentSectionOptions
): UseMarkdownContentSectionReturn {
  const { blockData, dependencies, readonly = false } = options;
  const { reactFlow, contentVersionRef, canvasMetadata } = dependencies;

  const { editor, handleEditorClick, mathEditing, setMathEditing } = useBlockNoteTiptap({
    blockData,
    reactFlow,
    editable: !readonly,
    placeholder: 'Click to add note...',
    contentVersionRef,
    canvasMetadata,
  });

  return {
    editor,
    handleEditorClick,
    mathEditing,
    setMathEditing,
  };
}
