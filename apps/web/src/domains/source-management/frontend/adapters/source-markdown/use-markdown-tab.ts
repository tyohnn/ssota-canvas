/**
 * useMarkdownTab - Source raw_content (markdown) 표시용 비즈니스 훅
 *
 * useSourceContent 사용. Summary tab과 동일한 UI (TipTap + TOC)로 마크다운 표시
 */
'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useSourceContent } from '@/domains/source-management/frontend/hooks';

import type { MarkdownTabRuntimeDeps } from '@/domains/source-management/frontend/adapters/contracts/runtime-deps';

export interface UseMarkdownTabParams {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export interface UseMarkdownTabResult {
  content: string | null | undefined;
  extractedAt: Date | null | undefined;
  isLoading: boolean;
  error: string | null;
  hasSourceId: boolean;
}

export function useMarkdownTab(
  { blockId, blockData }: UseMarkdownTabParams,
  deps: MarkdownTabRuntimeDeps
): UseMarkdownTabResult {
  const sourceId = blockData?.sourceId;
  const blockSlug =
    (blockData as { blockSlug?: string } | undefined)?.blockSlug ??
    blockData?.blockId ??
    blockId;
  const { workspaceId, readonly, publishToken } = deps;
  const isPublished = readonly && !!publishToken;

  const { content, isLoading, error } = useSourceContent(
    isPublished && sourceId && publishToken
      ? {
          blockId: blockSlug,
          sourceId,
          publishToken,
          readonly: true,
          enabled: !!blockSlug && !!sourceId,
        }
      : {
          blockId: blockSlug,
          workspaceId,
          enabled: !!blockSlug && !!sourceId,
        }
  );

  return {
    content: content?.rawContent ?? null,
    extractedAt: content?.extractedAt ?? null,
    isLoading,
    error: error ? String(error.message ?? 'Failed to load') : null,
    hasSourceId: !!sourceId,
  };
}
