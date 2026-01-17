'use client';

import { useMutation } from '@tanstack/react-query';
import { copyPublishedPageAction } from '../../actions/copy-published-page.action';
import {
  CopyPublishedPageRequestInput,
  CopyPublishedPageRequestSchema,
} from '../../shared/dtos/request';
import type { CopyResultDTO } from '../../shared/dtos/response';
import { isFailure } from '@/lib';

export type UseCopyPublishedPageParams = {
  onSuccess?: (result: CopyResultDTO) => void;
  onError?: () => void;
};

export type CopyPublishedPageInput = {
  publishToken: string;
  targetWorkspaceId: string;
};

export type UseCopyPublishedPageResult = {
  copyPublishedPage: (input: CopyPublishedPageInput) => Promise<CopyResultDTO | null>;
  isCopying: boolean;
};

/**
 * 게시된 페이지 복제 도메인 훅 (TanStack Query Mutation)
 *
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 에러 처리
 * - 로딩 상태 자동 관리
 */
export function useCopyPublishedPage(
  params?: UseCopyPublishedPageParams
): UseCopyPublishedPageResult {
  const { onSuccess, onError } = params || {};

  const mutation = useMutation({
    mutationFn: async (input: CopyPublishedPageInput) => {
      // Validation
      const rawRequest: CopyPublishedPageRequestInput = {
        publishToken: input.publishToken,
        targetWorkspaceId: input.targetWorkspaceId,
      };

      const parseResult = CopyPublishedPageRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid copy request');
      }

      const validatedRequest = parseResult.data;

      // Server Action
      const result = await copyPublishedPageAction(validatedRequest);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },

    onError: (error) => {
      console.error('Failed to copy published page:', error);
      onError?.();
    },
  });

  return {
    copyPublishedPage: async (
      input: CopyPublishedPageInput
    ): Promise<CopyResultDTO | null> => {
      try {
        return await mutation.mutateAsync(input);
      } catch (error) {
        return null;
      }
    },
    isCopying: mutation.isPending,
  };
}
