/**
 * Markdown (Extract) tab for X block editor.
 * Source raw_content 표시.
 */
'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { MarkdownTabView } from '@workspace/editor-panel';
import { useMarkdownTab } from '@/domains/source-management/frontend/adapters/source-markdown';
import { useSummaryContentDeps } from '@/domains/editor-panel/frontend/adapters/summary-content-deps';
import { useMarkdownTabCanvasDeps } from '@/domains/block-management/frontend/adapters/source-tab-canvas-deps';

export interface MarkdownTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function MarkdownTab({
  blockId,
  blockData,
}: MarkdownTabProps) {
  const markdownDeps = useMarkdownTabCanvasDeps();
  const { content, extractedAt, isLoading, error, hasSourceId } =
    useMarkdownTab(
      { blockId, blockData },
      markdownDeps
    );
  const summaryContentDeps = useSummaryContentDeps();

  return (
    <MarkdownTabView
      content={content}
      extractedAt={extractedAt}
      isLoading={isLoading}
      error={error}
      hasSourceId={hasSourceId}
      emptyMessage="Extraction runs automatically when you add an X post URL."
      summaryContentDeps={summaryContentDeps}
    />
  );
}
