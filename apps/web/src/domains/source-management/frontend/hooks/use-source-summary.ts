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

export type UseSourceSummaryParams = {
  blockId: string;
  language: string;
  sourceId?: string;
  publishToken?: string;
  readonly?: boolean;
  /** 이미 추출된 언어일 때만 fetch (미추출 언어 404 방지). 기본 true */
  isAlreadyExtracted?: boolean;
  /** 사용 가능한 요약 언어가 있을 때만 fetch. 기본 true */
  hasAvailableLanguages?: boolean;
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
    !!params.readonly && !!params.sourceId && !!params.publishToken;

  const queryKey = isPublished
    ? [
        'source-summary-published',
        params.blockId,
        params.sourceId!,
        params.publishToken!,
        params.language,
      ]
    : ['source-summary', params.blockId, params.language];

  const { workspaceId } = useCanvasMetadata();

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<SourceSummaryDTO | null>({
    queryKey,
    queryFn: async () => {
      if (isPublished && params.sourceId && params.publishToken) {
        const result = await getSourceSummaryForPublishedPageAction({
          publishToken: params.publishToken,
          blockId: params.blockId,
          sourceId: params.sourceId,
          language: params.language,
        });
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      const result = await getSourceSummaryAction({
        workspaceId: workspaceId ?? '',
        blockId: params.blockId,
        language: params.language,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled:
      (params.isAlreadyExtracted ?? true) &&
      (params.hasAvailableLanguages ?? true) &&
      !!params.sourceId && // 블록에 소스 연결됐을 때만 fetch
      !!params.blockId &&
      !!params.language &&
      (isPublished ? !!params.sourceId && !!params.publishToken : !!workspaceId),
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
