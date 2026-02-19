/**
 * Markdown tab for link block editor.
 * Source raw_content (markdown) 표시 - Summary tab과 동일한 UI (TipTap + TOC)
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import {
  MarkdownTabView,
  useMarkdownTab,
} from '@/domains/source-management/frontend/components/markdown-tab';

export interface MarkdownTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function MarkdownTab({
  blockId,
  blockData,
}: MarkdownTabProps) {
  const { content, isLoading, error, hasSourceId } = useMarkdownTab({
    blockId,
    blockData,
  });

  return (
    <MarkdownTabView
      content={content}
      isLoading={isLoading}
      error={error}
      hasSourceId={hasSourceId}
      emptyMessage="Extraction runs automatically when you add a URL."
    />
  );
}
