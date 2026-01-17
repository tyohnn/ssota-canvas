'use client';

import { useMutation } from '@tanstack/react-query';
import { getPublishedLinkAction } from '../../actions/get-published-link.action';
import {
  GetPublishedLinkRequestInput,
  GetPublishedLinkRequestSchema,
} from '../../shared/dtos/request';
import type { PublishedLinkViewDTO } from '../../shared/dtos/response';
import { isFailure } from '@/lib';

export type UsePublishedLinkParams = {
  onSuccess?: (result: PublishedLinkViewDTO | null) => void;
  onError?: () => void;
};

export type GetPublishedLinkInput = {
  pageId: string;
};

export type UsePublishedLinkResult = {
  getPublishedLink: (input: GetPublishedLinkInput) => Promise<PublishedLinkViewDTO | null>;
  isGettingLink: boolean;
};

/**
 * 게시 링크 조회 도메인 훅 (TanStack Query Mutation)
 *
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 에러 처리
 * - 로딩 상태 자동 관리
 * - 사용자 액션 기반 조회 (mutation 패턴)
 */
export function usePublishedLink(
  params?: UsePublishedLinkParams
): UsePublishedLinkResult {
  const { onSuccess, onError } = params || {};

  const mutation = useMutation({
    mutationFn: async (input: GetPublishedLinkInput) => {
      // Validation
      const rawRequest: GetPublishedLinkRequestInput = {
        pageId: input.pageId,
      };

      const parseResult = GetPublishedLinkRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid get link request');
      }

      const validatedRequest = parseResult.data;

      // Server Action
      const result = await getPublishedLinkAction(validatedRequest);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },

    onError: (error) => {
      console.error('Failed to get published link:', error);
      onError?.();
    },
  });

  return {
    getPublishedLink: async (
      input: GetPublishedLinkInput
    ): Promise<PublishedLinkViewDTO | null> => {
      try {
        return await mutation.mutateAsync(input);
      } catch (error) {
        return null;
      }
    },
    isGettingLink: mutation.isPending,
  };
}
