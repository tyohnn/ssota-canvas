'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGetAllWorkspacesByOrg } from '@/domains/workspace-management/frontend/hooks/use-get-all-workspaces-by-org';
import { getUser } from '@/domains/auth/client/auth-helpers';
import type { User } from '@supabase/supabase-js';
import { useDuplicateDialogUI } from './use-duplicate-dialog.ui';
import { useDuplicateDialogBusiness } from './use-duplicate-dialog.business';

interface UseDuplicateDialogProps {
  publishToken: string;
}

export function useDuplicateDialog({
  publishToken,
}: UseDuplicateDialogProps) {
  const router = useRouter();
  const ui = useDuplicateDialogUI();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  // Check user status when component mounts
  useEffect(() => {
    setIsCheckingUser(true);
    getUser()
      .then((userData) => {
        setUser(userData);
        setIsCheckingUser(false);
      })
      .catch(() => {
        setUser(null);
        setIsCheckingUser(false);
      });
  }, []);

  // Only fetch workspaces if user is authenticated and user check is complete
  const {
    data: workspacesByOrg,
    isLoading: isLoadingWorkspaces,
  } = useGetAllWorkspacesByOrg(!isCheckingUser && user !== null);

  const handleLogin = useCallback(() => {
    const redirectTo = `/p/${publishToken}?action=duplicate`;
    router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }, [publishToken, router]);

  const business = useDuplicateDialogBusiness({
    publishToken,
    selectedWorkspaceId: ui.selectedWorkspaceId,
    onSuccess: () => {
      // 성공 시 다이얼로그 닫기
      ui.onDialogOpenChange(false);
    },
  });

  // 초기 워크스페이스 선택
  useEffect(() => {
    if (!ui.selectedWorkspaceId && workspacesByOrg) {
      const firstWorkspace = workspacesByOrg.organizations
        .flatMap(org => org.workspaces)[0];
      if (firstWorkspace) {
        ui.setSelectedWorkspaceId(firstWorkspace.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.selectedWorkspaceId, workspacesByOrg]);

  return {
    ...ui,
    ...business,
    workspacesByOrg: workspacesByOrg ?? null,
    isLoading: isLoadingWorkspaces || business.isDuplicating,
    isDialogOpen: ui.isDialogOpen,
    onDialogOpenChange: ui.onDialogOpenChange,
    user,
    isCheckingUser,
    handleLogin,
  };
}
