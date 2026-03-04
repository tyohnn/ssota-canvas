/**
 * Drive Markdown (Extract) Tab
 *
 * Uses useMarkdownTab with Drive deps (no Canvas context).
 */

'use client';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import { useMarkdownTabDriveDeps } from '@/domains/drive/frontend/adapters/source-tab-drive-deps';
import { MarkdownTabView } from '@workspace/editor-panel';
import { useMarkdownTab } from '@/domains/source-management/frontend/adapters/source-markdown';
import { useSummaryContentDeps } from '@/domains/editor-panel/frontend/adapters/summary-content-deps';

export interface DriveMarkdownTabProps {
  blockId: string;
  blockData: DriveBlockData | undefined;
}

export function DriveMarkdownTab({
  blockId,
  blockData,
}: DriveMarkdownTabProps) {
  const markdownDeps = useMarkdownTabDriveDeps(blockData);
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
