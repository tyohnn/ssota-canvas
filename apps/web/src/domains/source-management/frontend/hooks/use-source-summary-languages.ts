/**
 * 특정 Source의 사용 가능한 summary들의 언어 목록 조회 훅
 */
'use client';

import { useQuery } from '@tanstack/react-query';

import { getSourceSummaryLanguagesAction } from '../../actions/summary/get-source-summary-languages.action';
import { getSourceSummaryLanguagesForPublishedPageAction } from '../../actions/published-page/get-source-summary-languages-for-published-page.action';

export type UseSourceSummaryLanguagesParams = {
  blockId: string;
  workspaceId?: string;
  sourceId?: string;
  publishToken?: string;
  readonly?: boolean;
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
  const isPublished = Boolean(
    params.readonly && params.sourceId && params.publishToken
  );
  const isEditableReady = !!params.workspaceId && !!params.sourceId;

  const queryKey = isPublished
    ? [
        'source-summary-languages-published',
        params.publishToken,
        params.sourceId,
      ]
    : ['source-summary-languages', params.sourceId];

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<string[]>({
    queryKey,
    queryFn: async () => {
      if (isPublished) {
        const result =
          await getSourceSummaryLanguagesForPublishedPageAction({
            publishToken: params.publishToken!,
            blockId: params.blockId,
            sourceId: params.sourceId!,
          });
        if (!result.success) throw new Error(result.error);
        return result.data.languages;
      }
      const result = await getSourceSummaryLanguagesAction({
        workspaceId: params.workspaceId ?? '',
        blockId: params.blockId,
      });
      if (!result.success) throw new Error(result.error);
      return result.data.languages;
    },
    enabled: !!params.blockId && (isPublished || isEditableReady),
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
