'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyProfileAction } from '../../actions/get-my-profile.action';
import type { UserProfile } from '../../shared/types';
import { isFailure } from '@/lib';

export type UseMyProfileResult = {
  data: UserProfile | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * 현재 사용자 프로필 조회 (TanStack Query)
 *
 * - 캐싱: queryKey ['user', 'my-profile']
 * - enabled로 조건부 호출 (예: Settings Profile 탭 활성 시)
 */
export function useMyProfile(enabled: boolean = true): UseMyProfileResult {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ['user', 'my-profile'],
    queryFn: async (): Promise<UserProfile> => {
      const result = await getMyProfileAction({});
      if (isFailure(result)) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled,
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
