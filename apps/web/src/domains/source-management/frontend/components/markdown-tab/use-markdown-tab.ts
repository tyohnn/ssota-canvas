/**
 * useMarkdownTab - Source raw_content (markdown) 표시용 비즈니스 훅
 *
 * useSourceContent 사용. Summary tab과 동일한 UI (TipTap + TOC)로 마크다운 표시
 */
'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useSourceContent } from '@/domains/source-management/frontend/hooks';

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

export function useMarkdownTab({
  blockId,
  blockData,
}: UseMarkdownTabParams): UseMarkdownTabResult {
  const sourceId = blockData?.sourceId;
  const blockSlug = blockData?.blockId ?? blockId;
  const { content, isLoading, error } = useSourceContent({
    blockId: blockSlug,
    enabled: !!blockSlug && !!sourceId,
  });

  return {
    content: content?.rawContent ?? null,
    extractedAt: content?.extractedAt ?? null,
    isLoading,
    error: error ? String(error.message ?? 'Failed to load') : null,
    hasSourceId: !!sourceId,
  };
}
