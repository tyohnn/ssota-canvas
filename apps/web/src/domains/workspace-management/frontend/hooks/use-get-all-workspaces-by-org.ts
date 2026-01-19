'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllWorkspacesByOrgAction } from '../../actions/get-all-workspaces-by-org.action';
import { GetAllWorkspacesByOrgRequestSchema } from '../../shared/schemas/workspace-navigation.schemas';
import type { AllWorkspacesByOrgDTO } from '../../shared/dtos';
import { isFailure } from '@/lib';


export type UseGetAllWorkspacesByOrgResult = {
  data: AllWorkspacesByOrgDTO | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * 모든 워크스페이스를 조직별로 조회 도메인 훅 (TanStack Query)
 *
 * - 자동 캐싱: 같은 queryKey로 여러 컴포넌트에서 호출해도 한 번만 요청
 * - 자동 refetch: staleTime 이후 백그라운드 refetch
 * - 로딩/에러 상태 자동 관리
 */
export function useGetAllWorkspacesByOrg(): UseGetAllWorkspacesByOrgResult {

  const {
    data,
    isLoading,
    isError,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['all-workspaces-by-org'],
    queryFn: async (): Promise<AllWorkspacesByOrgDTO> => {
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
    staleTime: 5 * 60 * 1000, // 5분
    retry: 1,
  });


  const refetch = async () => {
    await refetchQuery();
  };

  return {
    data: data ?? null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
