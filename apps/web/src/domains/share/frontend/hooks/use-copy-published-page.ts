'use client';

import { useMutation } from '@tanstack/react-query';
import { copyPublishedPageAction } from '../../actions/share.actions';
import { CopyPublishedPageRequestInput, CopyResultDTO } from '../../shared/dtos';

export function useCopyPublishedPage() {
  return useMutation<CopyResultDTO, Error, CopyPublishedPageRequestInput>({
    mutationFn: (request) => copyPublishedPageAction(request),
  });
}
