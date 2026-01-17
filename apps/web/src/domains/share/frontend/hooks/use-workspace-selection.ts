'use client';

import { useMutation } from '@tanstack/react-query';
import { getWorkspaceSelectionAction } from '@/domains/workspace-management/actions/get-workspace-selection.action';
import { GetWorkspaceSelectionRequestSchema } from '@/domains/workspace-management/shared/schemas/workspace-navigation.schemas';
import type { WorkspaceSelectionViewDTO } from '../../shared/dtos/response';
import { isFailure } from '@/lib';

export type UseWorkspaceSelectionParams = {
  onSuccess?: (result: WorkspaceSelectionViewDTO) => void;
  onError?: () => void;
};

export type GetWorkspaceSelectionInput = {
  organizationId: string;
};

export type UseWorkspaceSelectionResult = {
  getWorkspaceSelection: (
    input: GetWorkspaceSelectionInput
  ) => Promise<WorkspaceSelectionViewDTO | null>;
  isGettingSelection: boolean;
};

/**
 * 워크스페이스 선택 목록 조회 도메인 훅 (TanStack Query Mutation)
 *
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 에러 처리
 * - 로딩 상태 자동 관리
 * - 사용자 액션 기반 조회 (mutation 패턴)
 */
export function useWorkspaceSelection(
  params?: UseWorkspaceSelectionParams
): UseWorkspaceSelectionResult {
  const { onSuccess, onError } = params || {};

  const mutation = useMutation({
    mutationFn: async (input: GetWorkspaceSelectionInput) => {
      // Validation
      const rawRequest = {
        organizationId: input.organizationId,
      };

      const parseResult = GetWorkspaceSelectionRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid workspace selection request');
      }

      const validatedRequest = parseResult.data;

      // Server Action
      const result = await getWorkspaceSelectionAction(validatedRequest);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },

    onError: (error) => {
      console.error('Failed to get workspace selection:', error);
      onError?.();
    },
  });

  return {
    getWorkspaceSelection: async (
      input: GetWorkspaceSelectionInput
    ): Promise<WorkspaceSelectionViewDTO | null> => {
      try {
        return await mutation.mutateAsync(input);
      } catch (error) {
        return null;
      }
    },
    isGettingSelection: mutation.isPending,
  };
}
