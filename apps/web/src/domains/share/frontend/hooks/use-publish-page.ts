'use client';

import { useMutation } from '@tanstack/react-query';
import { publishPageAction } from '../../actions/publish-page.action';
import {
  PublishPageRequestInput,
  PublishPageRequestSchema,
} from '../../shared/dtos/request';
import type { PublishResultDTO } from '../../shared/dtos/response';
import { isFailure } from '@/lib';

export type UsePublishPageParams = {
  onSuccess?: (result: PublishResultDTO) => void;
  onError?: () => void;
};

export type PublishPageInput = {
  pageId: string;
};

export type UsePublishPageResult = {
  publishPage: (input: PublishPageInput) => Promise<PublishResultDTO | null>;
  isPublishing: boolean;
};

/**
 * 페이지 게시 도메인 훅 (TanStack Query Mutation)
 *
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 에러 처리
 * - 로딩 상태 자동 관리
 * - 쿼리 캐시 자동 무효화
 */
export function usePublishPage(
  params?: UsePublishPageParams
): UsePublishPageResult {
  const { onSuccess, onError } = params || {};

  const mutation = useMutation({
    mutationFn: async (input: PublishPageInput) => {
      // Validation
      const rawRequest: PublishPageRequestInput = {
        pageId: input.pageId,
      };

      const parseResult = PublishPageRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid publish request');
      }

      const validatedRequest = parseResult.data;

      // Server Action
      const result = await publishPageAction(validatedRequest);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },

    onError: (error) => {
      console.error('Failed to publish page:', error);
      onError?.();
    },
  });

  return {
    publishPage: async (
      input: PublishPageInput
    ): Promise<PublishResultDTO | null> => {
      try {
        return await mutation.mutateAsync(input);
      } catch (error) {
        return null;
      }
    },
    isPublishing: mutation.isPending,
  };
}
