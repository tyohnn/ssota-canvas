/**
 * Source summary 조회 훅
 * Block 기반 또는 Published Page 기반 (language 필수)
 */
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';

import { getSourceSummaryAction } from '../../actions/summary/get-source-summary.action';
import { getSourceSummaryForPublishedPageAction } from '../../actions/published-page/get-source-summary-for-published-page.action';
import type { SourceSummaryDTO } from '../../shared/dtos/responses/source-summary.responses';

export type UseSourceSummaryParams =
  | { blockId: string; language: string; enabled?: boolean }
  | {
      blockId: string;
      sourceId: string;
      publishToken: string;
      language: string;
      readonly: true;
      enabled?: boolean;
    };

export type UseSourceSummaryResult = {
  summary: SourceSummaryDTO | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useSourceSummary(
  params: UseSourceSummaryParams
): UseSourceSummaryResult {
  const isPublished =
    'readonly' in params && params.readonly && 'publishToken' in params;

  const queryKey = isPublished
    ? [
        'source-summary-published',
        params.blockId,
        (params as { sourceId: string }).sourceId,
        (params as { publishToken: string }).publishToken,
        params.language,
      ]
    : ['source-summary', (params as { blockId: string }).blockId, params.language];

  const { workspaceId } = useCanvasMetadata();

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<SourceSummaryDTO | null>({
    queryKey,
    queryFn: async () => {
      if (isPublished) {
        const { blockId, sourceId, publishToken, language } = params as {
          blockId: string;
          sourceId: string;
          publishToken: string;
          language: string;
        };
        const result = await getSourceSummaryForPublishedPageAction({
          publishToken,
          blockId,
          sourceId,
          language,
        });
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      const result = await getSourceSummaryAction({
        workspaceId: workspaceId ?? '',
        blockId: (params as { blockId: string }).blockId,
        language: params.language,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled:
      (params.enabled ?? true) &&
      !!params.blockId &&
      !!params.language &&
      (isPublished
        ? !!(params as { sourceId?: string }).sourceId &&
          !!(params as { publishToken?: string }).publishToken
        : !!workspaceId),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  return {
    summary: data,
    isLoading,
    error: queryError instanceof Error ? queryError : null,
    refetch: () => refetch(),
  };
}
