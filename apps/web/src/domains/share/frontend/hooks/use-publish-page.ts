'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishPageAction } from '../../actions/share.actions';
import { PublishPageRequestInput, PublishResultDTO } from '../../shared/dtos';

export function usePublishPage() {
  const queryClient = useQueryClient();

  return useMutation<PublishResultDTO, Error, PublishPageRequestInput>({
    mutationFn: (request) => publishPageAction(request),
    onSuccess: (_, variables) => {
      // 게시 상태 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['published-link', variables.pageId] });
      queryClient.invalidateQueries({ queryKey: ['published-page'] });
    },
  });
}
