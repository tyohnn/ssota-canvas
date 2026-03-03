/**
 * Markdown (Extract) tab for X block editor.
 * Source raw_content 표시.
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
  const { content, extractedAt, isLoading, error, hasSourceId } =
    useMarkdownTab({
      blockId,
      blockData,
    });

  return (
    <MarkdownTabView
      content={content}
      extractedAt={extractedAt}
      isLoading={isLoading}
      error={error}
      hasSourceId={hasSourceId}
      emptyMessage="Extraction runs automatically when you add an X post URL."
    />
  );
}
