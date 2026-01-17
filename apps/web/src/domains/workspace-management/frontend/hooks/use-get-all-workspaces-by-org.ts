'use client';

import { useMutation } from '@tanstack/react-query';
import { getAllWorkspacesByOrgAction } from '../../actions/get-all-workspaces-by-org.action';
import { GetAllWorkspacesByOrgRequestSchema } from '../../shared/schemas/workspace-navigation.schemas';
import type { AllWorkspacesByOrgDTO } from '../../shared/dtos';
import { isFailure } from '@/lib';

export type UseGetAllWorkspacesByOrgParams = {
  onSuccess?: (result: AllWorkspacesByOrgDTO) => void;
  onError?: () => void;
};

export type UseGetAllWorkspacesByOrgResult = {
  getAllWorkspacesByOrg: () => Promise<AllWorkspacesByOrgDTO | null>;
  isGettingWorkspaces: boolean;
};

/**
 * 모든 워크스페이스를 조직별로 조회 도메인 훅 (TanStack Query Mutation)
 *
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 에러 처리
 * - 로딩 상태 자동 관리
 * - 사용자 액션 기반 조회 (mutation 패턴)
 */
export function useGetAllWorkspacesByOrg(
  params?: UseGetAllWorkspacesByOrgParams
): UseGetAllWorkspacesByOrgResult {
  const { onSuccess, onError } = params || {};

  const mutation = useMutation({
    mutationFn: async () => {
      // Validation (void 스키마)
      const rawRequest = undefined;
      const parseResult = GetAllWorkspacesByOrgRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid request');
      }

      const validatedRequest = parseResult.data;

      // Server Action
      const result = await getAllWorkspacesByOrgAction(validatedRequest);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onSuccess: (data) => {
      onSuccess?.(data);
    },

    onError: (error) => {
      console.error('Failed to get all workspaces by org:', error);
      onError?.();
    },
  });

  return {
    getAllWorkspacesByOrg: async (): Promise<AllWorkspacesByOrgDTO | null> => {
      try {
        return await mutation.mutateAsync();
      } catch (error) {
        return null;
      }
    },
    isGettingWorkspaces: mutation.isPending,
  };
}
