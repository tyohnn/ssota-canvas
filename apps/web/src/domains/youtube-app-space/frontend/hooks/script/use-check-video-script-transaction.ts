/**
 * Video Script Action Transaction 확인 훅
 *
 * YouTube 블록에서 script 추출 액션이 실행된 적이 있는지 확인
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { checkActionTransactionAction } from '../../../actions/transaction/check-action-transaction.action';

export type UseCheckVideoScriptTransactionParams = {
  blockId: string;
  enabled?: boolean;
};

export type UseCheckVideoScriptTransactionResult = {
  exists: boolean;
  isLoading: boolean;
};

/**
 * Video Script Action Transaction 확인 훅
 *
 * @param params - blockId, enabled 옵션
 * @returns Action Transaction 존재 여부 및 로딩 상태
 */
export function useCheckVideoScriptTransaction(
  params: UseCheckVideoScriptTransactionParams
): UseCheckVideoScriptTransactionResult {
  const { blockId, enabled = true } = params;

  const { data, isLoading } = useQuery({
    queryKey: ['youtube-action-transaction', blockId, 'extract_script'],
    queryFn: async () => {
      if (!blockId) {
        return { exists: false };
      }

      const result = await checkActionTransactionAction({
        blockId,
        actionType: 'extract_script',
      });

      if (!result.success) {
        // 에러 발생 시 false로 처리 (안전하게 처리)
        return { exists: false };
      }

      return result.data;
    },
    enabled: enabled && !!blockId,
    staleTime: 24 * 60 * 60 * 1000, // 24시간 캐싱 (스크립트는 거의 변경되지 않음)
    retry: 1,
  });

  return {
    exists: data?.exists ?? false,
    isLoading,
  };
}
