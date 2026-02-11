/**
 * Source summary 사용 가능 언어 목록 조회 훅
 */
'use client';

import { useQuery } from '@tanstack/react-query';

import { getSourceSummaryLanguagesAction } from '../../actions/summary/get-source-summary-languages.action';
import { getSourceSummaryLanguagesForPublishedPageAction } from '../../actions/published-page/get-source-summary-languages-for-published-page.action';

export type UseSourceSummaryLanguagesParams =
  | { blockId: string; enabled?: boolean }
  | {
      blockId: string;
      sourceId: string;
      publishToken: string;
      readonly: true;
      enabled?: boolean;
    };

export type UseSourceSummaryLanguagesResult = {
  languages: string[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useSourceSummaryLanguages(
  params: UseSourceSummaryLanguagesParams
): UseSourceSummaryLanguagesResult {
  const isPublished =
    'readonly' in params && params.readonly && 'publishToken' in params;

  const queryKey = isPublished
    ? [
        'source-summary-languages-published',
        params.blockId,
        (params as { sourceId: string }).sourceId,
        (params as { publishToken: string }).publishToken,
      ]
    : ['source-summary-languages', (params as { blockId: string }).blockId];

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<string[]>({
    queryKey,
    queryFn: async () => {
      if (isPublished) {
        const { blockId, sourceId, publishToken } = params as {
          blockId: string;
          sourceId: string;
          publishToken: string;
        };
        const result =
          await getSourceSummaryLanguagesForPublishedPageAction({
            publishToken,
            blockId,
            sourceId,
          });
        if (!result.success) throw new Error(result.error);
        return result.data.languages;
      }
      const result = await getSourceSummaryLanguagesAction({
        blockId: (params as { blockId: string }).blockId,
      });
      if (!result.success) throw new Error(result.error);
      return result.data.languages;
    },
    enabled:
      (params.enabled ?? true) &&
      !!params.blockId &&
      (!isPublished ||
        (!!(params as { sourceId?: string }).sourceId &&
          !!(params as { publishToken?: string }).publishToken)),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  return {
    languages: data ?? [],
    isLoading,
    error: queryError instanceof Error ? queryError : null,
    refetch: () => refetch(),
  };
}
