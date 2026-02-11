/**
 * Source content (raw_content) 조회 훅
 * Block 기반 또는 Published Page 기반
 */
'use client';

import { useQuery } from '@tanstack/react-query';

import { getSourceContentAction } from '../../actions/source/get-source-content.action';
import { getSourceContentForPublishedPageAction } from '../../actions/published-page/get-source-content-for-published-page.action';
import type { SourceContentDTO } from '../../shared/dtos/responses/source.responses';

export type UseSourceContentParams =
  | { blockId: string; enabled?: boolean }
  | {
      blockId: string;
      sourceId: string;
      publishToken: string;
      readonly: true;
      enabled?: boolean;
    };

export type UseSourceContentResult = {
  content: SourceContentDTO | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useSourceContent(
  params: UseSourceContentParams
): UseSourceContentResult {
  const isPublished =
    'readonly' in params && params.readonly && 'publishToken' in params;

  const queryKey = isPublished
    ? [
        'source-content-published',
        params.blockId,
        (params as { sourceId: string }).sourceId,
        (params as { publishToken: string }).publishToken,
      ]
    : ['source-content', (params as { blockId: string }).blockId];

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<SourceContentDTO | null>({
    queryKey,
    queryFn: async () => {
      if (isPublished) {
        const { blockId, sourceId, publishToken } = params as {
          blockId: string;
          sourceId: string;
          publishToken: string;
        };
        const result = await getSourceContentForPublishedPageAction({
          publishToken,
          blockId,
          sourceId,
        });
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      const result = await getSourceContentAction({
        blockId: (params as { blockId: string }).blockId,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled:
      (params.enabled ?? true) &&
      !!params.blockId &&
      (!isPublished ||
        (!!(params as { sourceId?: string }).sourceId &&
          !!(params as { publishToken?: string }).publishToken)),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  return {
    content: data,
    isLoading,
    error: queryError instanceof Error ? queryError : null,
    refetch: () => refetch(),
  };
}
