'use client';

import { useMutation } from '@tanstack/react-query';
import { duplicatePublishedPageAction } from '../../actions/duplicate-published-page.action';
import {
  DuplicatePublishedPageRequestInput,
  DuplicatePublishedPageRequestSchema,
} from '../../shared/dtos/request';
import type { DuplicateResultDTO } from '../../shared/dtos/response';
import { isFailure } from '@/lib';

export type UseDuplicatePublishedPageParams = {
  onSuccess?: (result: DuplicateResultDTO) => void;
  onError?: () => void;
};

export type DuplicatePublishedPageInput = {
  publishToken: string;
  targetWorkspaceId: string;
};

export type UseDuplicatePublishedPageResult = {
  duplicatePublishedPage: (input: DuplicatePublishedPageInput) => Promise<DuplicateResultDTO | null>;
  isDuplicating: boolean;
};

/**
 * 게시된 페이지 복제 도메인 훅 (TanStack Query Mutation)
 *
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 에러 처리
 * - 로딩 상태 자동 관리
 */
export function useDuplicatePublishedPage(
  params?: UseDuplicatePublishedPageParams
): UseDuplicatePublishedPageResult {
  const { onSuccess, onError } = params || {};

  const mutation = useMutation({
    mutationFn: async (input: DuplicatePublishedPageInput) => {
      // Validation
      const rawRequest: DuplicatePublishedPageRequestInput = {
        publishToken: input.publishToken,
        targetWorkspaceId: input.targetWorkspaceId,
      };

      const parseResult = DuplicatePublishedPageRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid duplicate request');
      }

      const validatedRequest = parseResult.data;

      // Server Action
      const result = await duplicatePublishedPageAction(validatedRequest);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },

    onError: (error) => {
      console.error('Failed to duplicate published page:', error);
      onError?.();
    },
  });

  return {
    duplicatePublishedPage: async (
      input: DuplicatePublishedPageInput
    ): Promise<DuplicateResultDTO | null> => {
      try {
        return await mutation.mutateAsync(input);
      } catch (error) {
        return null;
      }
    },
    isDuplicating: mutation.isPending,
  };
}
