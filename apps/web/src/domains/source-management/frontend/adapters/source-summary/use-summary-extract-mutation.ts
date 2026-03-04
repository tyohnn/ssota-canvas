/**
 * useSummaryExtractMutation
 *
 * 역할: "요약 추출 실행"
 *
 * - Extract 버튼 클릭 시 processSourceSummaryAction 호출 → job 생성
 * - setAutoSummaryBlockId(blockUuid) → AI status 패널 Realtime 구독
 * - 낙관적 업데이트 콜백(언어 추가/제거) + 성공/실패 후 query invalidate
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { processSourceSummaryAction } from '@/domains/source-management/actions/summary/process-source-summary.action';

import type { SummaryExtractMutationDeps } from '@/domains/source-management/frontend/adapters/contracts/runtime-deps';

export interface UseSummaryExtractMutationParams {
  blockSlug: string;
  sourceId: string | undefined;
  onAddOptimisticLanguage: (language: string) => void;
  onRemoveOptimisticLanguage: (language: string) => void;
  refetchSummary: () => void;
}

export interface UseSummaryExtractMutationResult {
  mutate: (language: string) => void;
  isPending: boolean;
}

export function useSummaryExtractMutation(
  {
    blockSlug,
    sourceId,
    onAddOptimisticLanguage,
    onRemoveOptimisticLanguage,
    refetchSummary,
  }: UseSummaryExtractMutationParams,
  deps: SummaryExtractMutationDeps
): UseSummaryExtractMutationResult {
  const { workspaceId, setAutoSummaryBlockId } = deps;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // 1. processSourceSummaryAction 호출 → job 생성/기존 반환
    mutationFn: async (language: string) => {
      if (!workspaceId) throw new Error('Workspace not found');
      const result = await processSourceSummaryAction({
        workspaceId,
        blockId: blockSlug,
        language,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    // 2. 낙관적 업데이트: mutation 시작 시 언어를 "추출됨"으로 표시
    onMutate: (language) => {
      onAddOptimisticLanguage(language);
    },
    // 3. AI status 패널 Realtime 구독용 blockUuid 설정 (slug 대신 UUID 사용)
    onSuccess: (data) => {
      if (data?.blockUuid) {
        setAutoSummaryBlockId(data.blockUuid);
      } else {
        setAutoSummaryBlockId(blockSlug);
      }
    },
    // 4. 실패 시 낙관적으로 추가한 언어 제거
    onError: (_err, language) => {
      onRemoveOptimisticLanguage(language);
    },
    // 5. 성공/실패 모두: 요약/언어목록 refetch 및 query invalidate
    onSettled: () => {
      refetchSummary();
      queryClient.invalidateQueries({
        queryKey: ['source-summary', blockSlug],
      });
      if (sourceId) {
        queryClient.invalidateQueries({
          queryKey: ['source-summary-languages', sourceId],
        });
      }
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
  };
}
