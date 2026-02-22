/**
 * useExtractSourceContent
 *
 * 소스 콘텐츠(스크립트/트랜스크립트) 추출 mutation.
 * Timeline 탭 등에서 공통 사용.
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { extractSourceContentAction } from '@/domains/source-management/actions/source/extract-source-content.action';

export interface UseExtractSourceContentParams {
  blockSlug: string;
  sourceId: string | undefined;
  workspaceId: string | undefined;
}

export interface UseExtractSourceContentResult {
  extract: () => Promise<void>;
  isExtracting: boolean;
}

export function useExtractSourceContent({
  blockSlug,
  sourceId,
  workspaceId,
}: UseExtractSourceContentParams): UseExtractSourceContentResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!blockSlug) throw new Error('Block ID not found');
      if (!sourceId)
        throw new Error(
          'Please enter a URL and load metadata before extracting the script.'
        );
      if (!workspaceId) throw new Error('Workspace not found');
      const result = await extractSourceContentAction({
        workspaceId,
        blockId: blockSlug,
      });
      if (!result.success) {
        throw new Error(result.error || 'Failed to extract script');
      }
    },
    onSuccess: async () => {
      if (blockSlug) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['source-content', blockSlug],
          }),
          queryClient.invalidateQueries({
            queryKey: ['source-job-in-progress', blockSlug],
          }),
        ]);
      }
    },
  });

  const extract = async (): Promise<void> => {
    if (!sourceId || !blockSlug) return;
    await mutation.mutateAsync();
  };

  return {
    extract,
    isExtracting: mutation.isPending,
  };
}
