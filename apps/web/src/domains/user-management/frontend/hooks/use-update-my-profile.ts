'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserProfileAction } from '../../actions/update-user-profile.action';
import { isFailure } from '@/lib';

export type UpdateMyProfileInput = {
  name?: string;
  avatarUrl?: string | null;
  language?: string;
};

export type UseUpdateMyProfileParams = {
  onSuccess?: () => void;
};

export type UseUpdateMyProfileResult = {
  updateProfile: (input: UpdateMyProfileInput) => Promise<{ ok: true }>;
  isUpdating: boolean;
};

/**
 * 프로필 업데이트 (TanStack Query Mutation)
 *
 * - 성공 시 ['user', 'my-profile'] 쿼리 무효화
 */
export function useUpdateMyProfile(
  params?: UseUpdateMyProfileParams
): UseUpdateMyProfileResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: UpdateMyProfileInput) => {
      const result = await updateUserProfileAction(input);
      if (isFailure(result)) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'my-profile'] });
      params?.onSuccess?.();
    },
  });

  return {
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
