/**
 * Markdown tab for link block editor.
 * Source raw_content (markdown) 표시 - Summary tab과 동일한 UI (TipTap + TOC)
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
  const { content, extractedAt, isLoading, error, hasSourceId } = useMarkdownTab(
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
      emptyMessage="Extraction runs automatically when you add a URL."
      summaryContentDeps={summaryContentDeps}
    />
  );
}
