'use client';

import { useMutation } from '@tanstack/react-query';
import { unpublishPageAction } from '../../actions/unpublish-page.action';
import {
  UnpublishPageRequestInput,
  UnpublishPageRequestSchema,
} from '../../shared/dtos/request';
import { isFailure } from '@/lib';

export type UseUnpublishPageParams = {
  onSuccess?: () => void;
  onError?: () => void;
};

export type UnpublishPageInput = {
  pageId: string;
};

export type UseUnpublishPageResult = {
  unpublishPage: (input: UnpublishPageInput) => Promise<boolean>;
  isUnpublishing: boolean;
};

/**
 * 페이지 게시 취소 도메인 훅 (TanStack Query Mutation)
 *
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 에러 처리
 * - 로딩 상태 자동 관리
 */
export function useUnpublishPage(
  params?: UseUnpublishPageParams
): UseUnpublishPageResult {
  const { onSuccess, onError } = params || {};

  const mutation = useMutation({
    mutationFn: async (input: UnpublishPageInput) => {
      // Validation
      const rawRequest: UnpublishPageRequestInput = {
        pageId: input.pageId,
      };

      const parseResult = UnpublishPageRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid unpublish request');
      }

      const validatedRequest = parseResult.data;

      // Server Action
      const result = await unpublishPageAction(validatedRequest);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onSuccess: () => {
      onSuccess?.();
    },

    onError: (error) => {
      console.error('Failed to unpublish page:', error);
      onError?.();
    },
  });

  return {
    unpublishPage: async (input: UnpublishPageInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(input);
        return true;
      } catch (error) {
        return false;
      }
    },
    isUnpublishing: mutation.isPending,
  };
}
