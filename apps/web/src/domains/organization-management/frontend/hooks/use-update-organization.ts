'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrganizationAction } from '../../actions/update-organization.action';
import type { UpdateOrganizationRequest } from '../../shared/dtos';
import { isFailure } from '@/lib';

export type UseUpdateOrganizationParams = {
  onSuccess?: () => void;
};

/**
 * 조직 정보 수정 (TanStack Query Mutation)
 * - 성공 시 ['organization', organizationId] 쿼리 무효화
 */
export function useUpdateOrganization(params?: UseUpdateOrganizationParams) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: UpdateOrganizationRequest) => {
      const result = await updateOrganizationAction(input);
      if (isFailure(result)) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organization', variables.organizationId],
      });
      params?.onSuccess?.();
    },
  });

  return {
    updateOrganization: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
