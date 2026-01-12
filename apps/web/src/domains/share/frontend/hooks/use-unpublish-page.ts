'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unpublishPageAction } from '../../actions/share.actions';
import { UnpublishPageRequestInput } from '../../shared/dtos';

export function useUnpublishPage() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UnpublishPageRequestInput, { previousLink: any }>({
    mutationFn: (request) => unpublishPageAction(request),
    onMutate: async (variables) => {
      // 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['published-link', variables.pageId] });

      // 이전 값 보관
      const previousLink = queryClient.getQueryData(['published-link', variables.pageId]);

      // 낙관적 업데이트
      queryClient.setQueryData(['published-link', variables.pageId], null);

      return { previousLink };
    },
    onError: (_err, variables, context) => {
      // 오류 발생 시 롤백
      if (context?.previousLink) {
        queryClient.setQueryData(['published-link', variables.pageId], context.previousLink);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['published-link', variables.pageId] });
      queryClient.invalidateQueries({ queryKey: ['published-page'] });
    },
  });
}
