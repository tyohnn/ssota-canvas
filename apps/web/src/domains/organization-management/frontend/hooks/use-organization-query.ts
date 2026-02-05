'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrganizationAction } from '../../actions/get-organization.action';
import type { GetOrganizationResult } from '../../actions/get-organization.action';
import { isFailure } from '@/lib';

/**
 * 단일 조직 조회 (TanStack Query)
 * - RLS: 소유자만 조회 가능
 */
export function useOrganizationQuery(
  organizationId: string,
  enabled: boolean = true
) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async (): Promise<GetOrganizationResult> => {
      const result = await getOrganizationAction({ organizationId });
      if (isFailure(result)) throw new Error(result.error);
      return result.data;
    },
    enabled: enabled && !!organizationId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return { data, isLoading, isError, error, refetch };
}
